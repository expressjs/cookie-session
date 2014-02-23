test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--bail

clean:
	@rm -rf node_modules

.PHONY: test clean