describe 'GraphicCell class', ->

  makeRatioTestsFor = (key) ->

    #NB this is hard to understand, but basically i cant do a one line object generation when the key is dynamic
    makeConfig = (v) ->
      c = {}
      c[key] = v
      c

    describe 'must be an float between 0 and 1 inclusive:', ->
      it "#{key}=-1 causes errors", -> expect(=> @withConfig makeConfig(-1)).to.throw new RegExp "#{key}"
      it "#{key}=2 causes errors", -> expect(=> @withConfig makeConfig(2)).to.throw new RegExp "#{key}"
      it "#{key}='dogs' causes errors", -> expect(=> @withConfig makeConfig('dogs')).to.throw new RegExp "#{key}"
      it "#{key}='0' is ok", -> expect(=> @withConfig makeConfig('0')).not.to.throw()
      it "#{key}='0.5' is ok", -> expect(=> @withConfig makeConfig('0.5')).not.to.throw()

  maketextHandlingTestsFor = (key) ->

    #NB this is hard to understand, but basically i cant do a one line object generation when the key is dynamic
    makeConfig = (v, extra={}) ->
      c = {}
      c[key] = v
      _.extend c, extra

    beforeEach ->
      @baseCellSetCssSpy = sinon.spy BaseCell.prototype, 'setCss'
      BaseCell.setDefault 'font-size', '24px'

      @wasSet = (param) ->
        cssThatWasSet = @baseCellSetCssSpy.args.map (callValues) -> callValues[1]
        expect(cssThatWasSet).to.include param

    afterEach ->
      BaseCell.prototype.setCss.restore()
      BaseCell.resetDefaults()

    describe 'string as input:', ->
        it 'builds the config object and uses BaseCell.default font-size', ->
          @withConfig makeConfig 'test-text'
          expect(@instance.config[key]).to.deep.equal { text: 'test-text', 'font-size': '24px' }

    describe 'object as input:', ->
      it 'must have a text field', ->
        expect( => @withConfig makeConfig {}).to.throw new RegExp 'must have text field'

      it 'calls setCss on all its members', ->
        @withConfig makeConfig {
          text: 'test-text'
          'font-size': '12px'
          'font-family': 'fam'
          'font-color': 'blue'
          'font-weight': '900'
        }

        expect(@instance.config[key]).to.deep.equal {
          text: 'test-text'
          'font-size': '12px'
          'font-family': 'fam'
          'font-color': 'blue'
          'font-weight': '900'
        }

        @wasSet 'font-size'
        @wasSet 'font-family'
        @wasSet 'font-color'
        @wasSet 'font-weight'

      describe '"percentage" keyword:', ->

        it 'accepts percentage in string form and uses the percentage as text value', ->
          @withConfig makeConfig 'percentage', { percentage: '0.5' }
          expect(@instance.config[key].text).to.equal '50%'

        it 'accepts percentage in string form and uses the percentage as text value', ->
          @withConfig makeConfig { text: 'percentage' }, { percentage: '0.5' }
          expect(@instance.config[key].text).to.equal '50%'

  beforeEach ->
    @withConfig = (config, width=100, height=100) ->
      @instance = new GraphicCell 'dummySvg', ['parentSelector'], width, height

      config.variableImageUrl ?= 'image1'
      @instance.setConfig config

  describe 'setConfig():', ->

    it 'clones config so cannot be manip from outside', ->
      @outerConfig = { variableImageUrl: 'image1' }
      @withConfig @outerConfig
      @outerConfig.mittens = 'foo'

      expect(@instance.config).not.to.have.property 'mittens'

    describe 'variableImageUrl:', ->
      it 'is required', ->
        thrower = () =>
          @instance = new GraphicCell 'dummySvg', ['parentSelector'], 100, 100
          @instance.setConfig {}
        expect(thrower).to.throw new RegExp "Must specify 'variableImageUrl'"

    describe 'baseImageUrl:', ->
      it 'is optional', ->
        expect( => @withConfig {}).not.to.throw()

    describe 'numRows/numCols/numImages:', ->

      describe 'defaults:', ->
        beforeEach -> @withConfig {}
        it 'numImages defaults to 1', -> expect(@instance.config.numImages).to.equal 1
        it 'numRows defaults to undefined', -> expect(@instance.config).not.to.have.property 'numRows'
        it 'numCols defaults to undefined', -> expect(@instance.config).not.to.have.property 'numCols'

      describe 'only accepts positive integers:', ->
        it 'numRows=0 causes errors', -> expect(=> @withConfig { numRows: 0 }).to.throw new RegExp 'Must be positive integer'
        it 'numCols=0 causes errors', -> expect(=> @withConfig { numCols: 0 }).to.throw new RegExp 'Must be positive integer'
        it 'numImages=0 causes errors', -> expect(=> @withConfig { numImages: 0 }).to.throw new RegExp 'Must be positive integer'

        it 'numRows=dogs causes errors', -> expect(=> @withConfig { numRows: 'dogs' }).to.throw new RegExp 'Must be integer'
        it 'numCols=dogs causes errors', -> expect(=> @withConfig { numCols: 'dogs' }).to.throw new RegExp 'Must be integer'
        it 'numImages=dogs causes errors', -> expect(=> @withConfig { numImages: 'dogs' }).to.throw new RegExp 'Must be integer'

        it 'numRows="2" is ok', -> expect(=> @withConfig { numRows: '2' }).not.to.throw()
        it 'numCols="2" is ok', -> expect(=> @withConfig { numCols: '2' }).not.to.throw()
        it 'numImages="2" is ok', -> expect(=> @withConfig { numImages: '2' }).not.to.throw()

      it 'throws error when both numRows and numCols is provided', ->
        expect(=> @withConfig { numRows: 2, numCols: 2 }).to.throw new RegExp 'Cannot specify both numRows and numCols'

    describe '"percentage" handling:', ->

      it 'defaults to 1', ->
        @withConfig {}
        expect(@instance.config.percentage).to.equal 1

      makeRatioTestsFor 'percentage'

      describe 'interpret strings starting with "="', ->
        it 'percentage="=3/4" will compute to 0.75', ->
          @withConfig { percentage: '=3/4' }
          expect(@instance.config.percentage).to.equal 0.75

        it 'percentage="=5/4" will throw error (out of bounds)', -> expect(=> @withConfig { percentage: '=5/4' }).to.throw new RegExp 'percentage'

    describe '"direction" handling:', ->
      beforeEach ->
        @useDirection = (direction) ->
          @withConfig { direction: direction }
          @instance.config.direction

      it 'defaults to horizontal', ->
        @withConfig {}
        expect(@instance.config.direction).to.equal 'horizontal'

      it 'accepts horizontal', -> expect(@useDirection 'horizontal').to.equal 'horizontal'
      it 'accepts vertical', -> expect(@useDirection 'vertical').to.equal 'vertical'
      it 'accepts scale', -> expect(@useDirection 'scale').to.equal 'scale'
      it 'does not accept anything else', -> expect(=> @useDirection 'something').to.throw new RegExp 'direction'

    describe '"padding" handling:', ->
      describe 'defaults:', ->
        beforeEach -> @withConfig {}
        it 'interRowPadding set to 0.05', -> expect(@instance.config.interRowPadding).to.equal 0.05
        it 'interColumnPadding set to 0.05', -> expect(@instance.config.interColumnPadding).to.equal 0.05

      describe 'must be an float between 0 and 1 inclusive:', ->
        makeRatioTestsFor 'interRowPadding'
        makeRatioTestsFor 'interColumnPadding'

    describe 'text handling:', ->

      describe 'text-header', ->
        maketextHandlingTestsFor 'text-header'

      describe 'text-overlay', ->
        maketextHandlingTestsFor 'text-overlay'

      describe 'text-footer', ->
        maketextHandlingTestsFor 'text-footer'

  describe '_computeDimensions():', ->
    beforeEach ->
      @textHeader = 18
      @textFooter = 36
      @graphicHeight = 500

      @withConfig {
        'text-header': { 'font-size': "#{@textHeader}px", text: 'foo' }
        'text-footer': { 'font-size': "#{@textFooter}px", text: 'foo' }
      }, 500, @graphicHeight
      @instance._computeDimensions()

      @d = (k) -> @instance.dimensions[k]

    it 'calculates headerHeight correctly', -> expect(@d 'headerHeight').to.equal @textHeader
    it 'calculates footerHeight correctly', -> expect(@d 'footerHeight').to.equal @textFooter
    it 'calculates graphicHeight correctly', -> expect(@d 'graphicHeight').to.equal @graphicHeight - @textHeader - @textFooter
    it 'calculates graphicOffset correctly', -> expect(@d 'graphicOffset').to.equal @textHeader
    it 'calculates footerOffset correctly', -> expect(@d 'footerOffset').to.equal @textHeader + (@graphicHeight - @textHeader - @textFooter)

  describe '_generateDataArray():', ->

    beforeEach ->
      @withConfig {} #NB config doesnt matter just get me an @instance!
      @calc = (percentage, numImages) -> @instance._generateDataArray percentage, numImages

    it 'single image 100%', ->
      expect(@calc percent=1, numImages=1).to.deep.equal [{ percentage: 1, i: 0 }]

    it 'single image 50%', ->
      expect(@calc percent=0.5, numImages=1).to.deep.equal [{ percentage: 0.5, i: 0 }]

    it '5 image 85%', ->
      expect(@calc percent=0.85, numImages=5).to.deep.equal [
        { percentage: 1, i: 0 }
        { percentage: 1, i: 1 }
        { percentage: 1, i: 2 }
        { percentage: 1, i: 3 }
        { percentage: 0.25, i: 4 } # woah 0.85 = 0.25?? 0.8 goes to first 4. 0.05 / 0.2 is 0.25. BAM
      ]

  describe 'e2e tests:', ->

    beforeEach ->
      @makeGraphic = (config) ->
        unique = "#{Math.random()}".replace(/\./g,'')
        $('body').append("<div class=\"#{unique}\">")

        anonSvg = $('<svg class="test-svg">')
          .attr 'id', 'test-svg'
          .attr 'width', '100%'
          .attr 'height', '100%'

        $(".#{unique}").append(anonSvg)

        @svg = d3.select(anonSvg[0])

        @instance = new GraphicCell @svg, ['test-svg'], 500, 500
        @instance.setConfig config
        @instance.draw()

        return unique

    describe 'node classes:', ->

      beforeEach ->
        @uniqueClass = @makeGraphic {
          'percentage': 0.875
          'numImages': 4
          #@TODO: This is hitting Kyle S3 account !
          'variableImageUrl': 'https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/blue_square_512.png'
        }

        it 'generates correct node classes', ->
          expect($(".#{@uniqueClass} .node").length).to.equal 4
          expect($(".#{@uniqueClass} .node-index-0").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-1").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-2").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-3").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-4").length).to.equal 0
          expect($(".#{@uniqueClass} .node-xy-0-0").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-0-1").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-1-0").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-1-1").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-2-0").length).to.equal 0

    describe 'multi image horizontal scaled graphic:', ->

      beforeEach ->
        @uniqueClass = @makeGraphic {
          'percentage': 0.875
          'numImages': 4
          #@TODO: This is hitting Kyle S3 account !
          'variableImageUrl': 'https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/blue_square_512.png'
        }

      it 'applies a clip path to hide part of the fourth image', ->
        firstImageClipWidth = parseFloat($(".#{@uniqueClass} .node-xy-0-0 clippath rect").attr('width'))
        fourthImageClipWidth = parseFloat($(".#{@uniqueClass} .node-xy-1-1 clippath rect").attr('width'))

        expect(fourthImageClipWidth / firstImageClipWidth).to.be.closeTo(0.5, 0.001);

    describe 'multi image vertical scaled graphic:', ->
      beforeEach ->
        @uniqueClass = @makeGraphic {
          'percentage': 0.875
          'direction': 'vertical'
          'numImages': 4
          #@TODO: This is hitting Kyle S3 account !
          'variableImageUrl': 'https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/blue_square_512.png'
        }

      it 'applies a clip path to hide part of the fourth image', ->
        firstImageClipHeight = parseFloat($(".#{@uniqueClass} .node-xy-0-0 clippath rect").attr('height'))
        fourthImageClipHeight = parseFloat($(".#{@uniqueClass} .node-xy-1-1 clippath rect").attr('height'))

        expect(fourthImageClipHeight / firstImageClipHeight).to.be.closeTo(0.5, 0.001);

    describe 'multi image percentage scaled graphic:', ->

      beforeEach ->
        @uniqueClass = @makeGraphic {
          'percentage': 0.875
          'numImages': 4
          'direction': 'scale'
          #@TODO: This is hitting Kyle S3 account !
          'variableImageUrl': 'https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/blue_square_512.png'
        }

      it 'applies a clip path to hide part of the fourth image', ->
        firstImageWidth = parseFloat($(".#{@uniqueClass} .node-xy-0-0 image").attr('width'))
        fourthImageWidth = parseFloat($(".#{@uniqueClass} .node-xy-1-1 image").attr('width'))
        firstImageHeight = parseFloat($(".#{@uniqueClass} .node-xy-0-0 image").attr('height'))
        fourthImageHeight = parseFloat($(".#{@uniqueClass} .node-xy-1-1 image").attr('height'))

        expect(fourthImageWidth / firstImageWidth).to.be.closeTo(0.5, 0.001);
        expect(fourthImageHeight / firstImageHeight).to.be.closeTo(0.5, 0.001);