#
# VARIABLES
#
DONE = ✓
BUILD = $(shell pwd)/dist
JS = vanilla.elegant.js
JSOBJS = $(foreach js, $(JS), $(BUILD)/$(js))
JSOBJS_COMPRESSED = $(foreach js, $(JSOBJS), $(JSOBJS:.js=.min.js))
JSCOMPRESS = cat


all: clean js

.PHONY: docs js clean


#
# DOCS SERVER
#
docs: js
	@mkdir -p docs/assets/js
	@cp $(BUILD)/vanilla.elegant.js -t docs/assets/js
	@xdg-open http://localhost:5007/ 2>/dev/null
	@cd docs && python -m SimpleHTTPServer 5007


#
# BUILD
#
js: $(JSOBJS_COMPRESSED)


$(JSOBJS):
	@mkdir -p $(BUILD)
	@echo -n "Compiling and minifying js..."
	@cat src/vanilla.elegant.js >> $@


$(JSOBJS_COMPRESSED): $(JSOBJS)
	@echo -e "/**\n * The Elegant Textarea by Vital Kudzelka\n * Licensed under the MIT license\n * http://opensource.org/licenses/MIT\n */" > $@
	@$(JSCOMPRESS) $< >> $@
	@echo "                                $(DONE)"


clean:
	@rm -rf dist
