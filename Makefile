#
# VARIABLES
#
DONE = ✓
BUILD = $(shell pwd)/dist
JS = vanilla.elegant.js
JSOBJS = $(foreach js, $(JS), $(BUILD)/$(js))
JSCOMPRESS = cat
JSOBJS_COMPRESSED = $(JSOBJS:.js=.min.js)
SRC = src/vanilla.elegant.js


all: clean $(JSOBJS_COMPRESSED) docs

.PHONY: docs clean


#
# DOCS SERVER
#
docs: $(JSOBJS)
	@mkdir -p docs/assets/js
	@cp $< -t docs/assets/js
	@cd docs && python -m SimpleHTTPServer 5007


#
# BUILD
#
$(JSOBJS): $(SRC)
	@mkdir -p $(BUILD)
	@echo -n "Compiling and minifying js..."
	@cat $< >> $@


$(JSOBJS_COMPRESSED): $(JSOBJS)
	@echo -e "/**\n * The Elegant Textarea by Vital Kudzelka\n * Licensed under the MIT license\n * http://opensource.org/licenses/MIT\n */" > $@
	@$(JSCOMPRESS) $< >> $@
	@echo "                                $(DONE)"


#
# CLEANUP
#
clean:
	@rm -rf dist
