FROM ubuntu:20.04 as base

LABEL maintainer="SwiftWasm Maintainers <hello@swiftwasm.org>"
LABEL Description="Docker Container for the SwiftWasm toolchain and SDK"
LABEL org.opencontainers.image.source https://github.com/swiftwasm/swiftwasm-docker

RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true && apt-get -q update && \
    apt-get -q install -y \
    binutils \
    git \
    gnupg2 \
    libc6-dev \
    libcurl4 \
    libedit2 \
    libgcc-9-dev \
    libpython2.7 \
    libsqlite3-0 \
    libstdc++-9-dev \
    libxml2 \
    libz3-dev \
    pkg-config \
    tzdata \
    zlib1g-dev \
    && rm -r /var/lib/apt/lists/*

RUN set -e; \
    SWIFT_BIN_URL="https://swift-cloud-toolchains.s3.amazonaws.com/swift-wasm-DEVELOPMENT-SNAPSHOT-ubuntu20.04_x86_64.tar.gz" \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -q update && apt-get -q install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL "$SWIFT_BIN_URL" -o swift.tar.gz \
    && tar -xzf swift.tar.gz --directory / --strip-components=1 \
    && chmod -R o+r /usr/lib/swift \
    && rm -rf swift.tar.gz \
    && apt-get purge --auto-remove -y curl

RUN swift --version

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
