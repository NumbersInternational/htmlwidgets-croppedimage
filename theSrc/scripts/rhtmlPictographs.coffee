'use strict'

HTMLWidgets.widget
  name: 'rhtmlPictographs'
  type: 'output'

  resize: (el, width, height, instance) ->
    console.log "resize not implemented"

  initialize: (el, width, height) ->
    return new Pictograph el, width, height

  renderValue: (el, params, instance) ->

    config = null
    try
      if _.isString params.settingsJsonString
        config = JSON.parse params.settingsJsonString
      else
        config = params.settingsJsonString

      #@TODO: update docs so that percentage is not a top level param any more
      if params.percentage?
        config.percentage = params.percentage

    catch err
      msg =  "Pictograph error : Cannot parse 'settingsJsonString': #{err}"
      console.error msg
      throw new Error err

    instance.setConfig config
    instance.draw()
