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

CURRENT = $(shell git describe --tags --long --always 2>/dev/null || echo unknown)


all: clean $(JSOBJS_COMPRESSED) docs

.PHONY: clean docs gh-pages


#
# DOCS SERVER
#
docs: $(JSOBJS)
	@mkdir -p docs/assets/js
	@cp $< -t docs/assets/js
	@cd docs && python -m SimpleHTTPServer 5007


#
# PUBLISH GH-PAGES
#
gh-pages: $(JSOBJS_COMPRESSED)
	git clone git@github.com:vitalk/js-elegant-textarea.git gh-pages
	cd gh-pages && git checkout gh-pages
	cp -rv docs/* -t gh-pages/
	cd gh-pages && git add . && git commit -e -m "update gh-pages at master@$(CURRENT)"
	cd gh-pages && git pull origin gh-pages
	cd gh-pages && git push origin gh-pages
	rm gh-pages -rf


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
