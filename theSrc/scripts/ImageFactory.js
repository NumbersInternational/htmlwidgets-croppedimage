const _ = require('lodash')

const CircleType = require('./imageTypes/circle.imagetype')
const EllipseType = require('./imageTypes/ellipse.imagetype')
const SquareType = require('./imageTypes/square.imagetype')
const RectangleType = require('./imageTypes/rectangle.imagetype')
const RecoloredExternalSvg = require('./imageTypes/recoloredExternalSvg.imagetype')
const UrlType = require('./imageTypes/url.imagetype')

const ClipFactory = require('./ClipFactory')

class ImageFactory {
  static get types () {
    return {
      circle: CircleType,
      square: SquareType,
      url: UrlType,
      rect: RectangleType,
      ellipse: EllipseType,
      data: UrlType,
      recoloredExternalSvg: RecoloredExternalSvg,
    }
  }

  static get basicShapes () {
    return ['circle', 'ellipse', 'square', 'rect']
  }

  static get scalingStrategies () {
    return {
      vertical: { clip: 'frombottom' },
      horizontal: { clip: 'fromleft' },
      fromleft: { clip: 'fromleft' },
      fromright: { clip: 'fromright' },
      frombottom: { clip: 'frombottom' },
      fromtop: { clip: 'fromtop' },
      scale: 'scale',
      radialclip: { clip: 'radial' },
      radial: { clip: 'radial' },
      pie: { clip: 'radial' },
    }
  }

  static get validScalingStrategyStrings () {
    return _.keys(ImageFactory.scalingStrategies)
  }

  static get validScalingStrategyKeys () {
    return ['clip', 'scale']
  }

  static validateAspectRatioString (candidateAspectRatio) {
    // https://developer.mozilla.org/en/docs/Web/SVG/Attribute/preserveAspectRatio
    const validAlignStrings = [
      'none',
      'xMinYMin',
      'xMidYMin',
      'xMaxYMin',
      'xMinYMid',
      'xMidYMid',
      'xMaxYMid',
      'xMinYMax',
      'xMidYMax',
      'xMaxYMax',
    ]

    const validMeetOrSlice = ['meet', 'slice']

    const [align, meetOrSlice] = candidateAspectRatio.split(' ')

    if (!validAlignStrings.includes(align)) {
      throw new Error(`Invalid preserveAspectRatio string '${candidateAspectRatio}'`)
    }

    if (meetOrSlice && !validMeetOrSlice.includes(meetOrSlice)) {
      throw new Error(`Invalid preserveAspectRatio string '${candidateAspectRatio}'`)
    }
  }

  static parseConfig (newConfig) {
    let config = {}

    if (!_.isString(newConfig)) {
      if (!(newConfig.type in ImageFactory.types)) {
        throw new Error(`Invalid image creation config : unknown image type ${newConfig.type}`)
      }
      config = newConfig
    } else {
      config = ImageFactory.parseConfigString(newConfig)
    }

    if (config.color && config.url) {
      if (config.url.match(/\.svg$/)) {
        config.type = 'recoloredExternalSvg'
      } else {
        throw new Error(`Cannot recolor ${config.url}: unsupported image type for recoloring`)
      }
    }

    if (_.has(config, 'preserveAspectRatio')) {
      ImageFactory.validateAspectRatioString(config.preserveAspectRatio)
    }

    return config
  }

  static parseConfigString (configString) {
    const config = {}
    if (configString.length <= 0) {
      throw new Error("Invalid image creation configString '' : empty string")
    }

    let configParts = []

    const httpRegex = new RegExp('^(.*?):?(https?://.*)$')
    const matchesHttp = configString.match(httpRegex)
    if (matchesHttp) {
      configParts = _.without(matchesHttp[1].split(':'), 'url')
      config.type = 'url'
      config.url = matchesHttp[2]
    } else {
      configParts = configString.split(':')

      // NB TODO ! converting to const breaks flow !
      config.type = configParts.shift()
      if (!(config.type in ImageFactory.types)) {
        throw new Error(`Invalid image creation configString '${configString}' : unknown image type ${config.type}`)
      }
    }

    if (['url'].includes(config.type) && (config.url == null)) {
      config.url = configParts.pop()
      const hasDot = new RegExp(/\./)
      if (!config.url || !config.url.match(hasDot)) {
        throw new Error(`Invalid image creation configString '${configString}' : url string must end with a url`)
      }
    }

    if (['data'].includes(config.type)) {
      config.url = `data:${configParts.pop()}`
      // TODO this logic needs to check there is something after data:
      if (!config.url) {
        throw new Error(`Invalid image creation configString '${configString}' : data string must have a data url as last string part`)
      }
    }

    const unknownParts = []
    let part = configParts.shift()
    while (part) {
      if (part in ImageFactory.scalingStrategies) {
        const handler = ImageFactory.scalingStrategies[part]
        if (_.isString(handler)) {
          config[handler] = true
        } else {
          _.extend(config, handler)
        }
      } else if (part.match(/opacity=/)) {
        const [, opacityValueString] = part.split('=')
        const opacityValue = parseFloat(opacityValueString)
        if (_.isNaN(opacityValue) || opacityValue < 0 || opacityValue > 1) {
          throw new Error(`Invalid opacity '${opacityValue}': Must be between 0 and 1`)
        }
        config.opacity = opacityValue
      } else {
        unknownParts.push(part)
      }
      part = configParts.shift()
    }

    if (unknownParts.length > 1) {
      throw new Error(`Invalid image creation configString '${configString}' : too many unknown parts: [${unknownParts.join(',')}]`)
    }
    if (unknownParts.length === 1) {
      config.color = unknownParts[0]
    }

    return config
  }

  static isInternetExplorer () {
    const userAgentString = window.navigator.userAgent
    const oldIe = userAgentString.indexOf('MSIE ')
    const newIe = userAgentString.indexOf('Trident/')

    if ((oldIe > -1) || (newIe > -1)) {
      return true
    }

    return false
  }

  constructor ({ definitionManager }) {
    this.definitionManager = definitionManager
  }

  addBaseImageTo (d3Node, config, width, height, dataAttributes) {
    config = ImageFactory.parseConfig(config)
    // VIS-121 - Prevent base svgs from peeking out over the variable images (only for basic shapes)
    if (_.includes(ImageFactory.basicShapes, config.type) && ImageFactory.isInternetExplorer()) {
      config.baseShapeScale = 0.98
    }
    return this.addImageTo(d3Node, config, width, height, dataAttributes)
  }

  addVarImageTo (d3Node, config, width, height, dataAttributes) {
    config = ImageFactory.parseConfig(config)
    return this.addImageTo(d3Node, config, width, height, dataAttributes)
  }

  addImageTo (d3Node, config, width, height, dataAttributes) {
    const imageInstance = this.createInstance(d3Node, config, width, height, dataAttributes)

    return Promise.resolve()
      .then(imageInstance.calculateImageDimensions.bind(imageInstance))
      .then((imageDimensions) => {
        if (config.clip) {
          const newClipId = ClipFactory.addClipPath(config.clip, d3Node, imageDimensions)
          return newClipId
        } else {
          return null
        }
      })
      .then((clipId) => {
        const imageHandle = imageInstance.appendToSvg()
        if (clipId) {
          imageHandle.attr('clip-path', `url(#${clipId})`)
        }
      })
  }

  calculateAspectRatio (config) {
    config = ImageFactory.parseConfig(config)
    const instance = this.createInstance(null, config, null, null, null)
    return instance.calculateDesiredAspectRatio()
  }

  createInstance (d3Node, config, width, height, dataAttributes) {
    if (!_.has(ImageFactory.types, config.type)) {
      throw new Error(`Invalid image type '${config.type}'`)
    }

    return new ImageFactory.types[config.type](d3Node, config, width, height, dataAttributes, this.definitionManager)
  }
}

module.exports = ImageFactory
