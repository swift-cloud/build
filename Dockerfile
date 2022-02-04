
FROM ghcr.io/swiftwasm/swift:latest as base
COPY --from=node:16 . .
RUN node --version
RUN yarn --version
RUN set -e; \
    BINARYEN_BIN_URL="https://github.com/WebAssembly/binaryen/releases/download/version_105/binaryen-version_105-x86_64-linux.tar.gz" \
    && curl -fsSL "$BINARYEN_BIN_URL" -o binaryen.tar.gz \
    && tar -xzf binaryen.tar.gz --directory / \
    && cp -r /binaryen-version_105/* /usr/ \
    && chmod -R o+r /usr/bin/wasm-opt \
    && rm -rf binaryen.tar.gz binaryen-version_105
RUN wasm-opt --version

FROM base as app
ADD src ./src
COPY *.json *.lock ./
RUN yarn install
RUN yarn build
CMD [ "node", "./bin/fargate.js" ]
