FROM ubuntu:20.04

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

ARG SWIFT_TAG=swift-wasm-5.6.0-RELEASE
ENV SWIFT_PLATFORM_SUFFIX=ubuntu20.04_x86_64.tar.gz
ENV SWIFT_TAG=$SWIFT_TAG

RUN set -e; \
    SWIFT_BIN_URL="https://github.com/swiftwasm/swift/releases/download/$SWIFT_TAG/$SWIFT_TAG-$SWIFT_PLATFORM_SUFFIX" \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -q update && apt-get -q install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL "$SWIFT_BIN_URL" -o swift.tar.gz \
    && tar -xzf swift.tar.gz --directory / --strip-components=1 \
    && chmod -R o+r /usr/lib/swift \
    && rm -rf swift.tar.gz

# Verify swift version
RUN swift --version

# Install Binaryen
RUN set -e; \
    BINARYEN_BIN_URL="https://github.com/WebAssembly/binaryen/releases/download/version_105/binaryen-version_105-x86_64-linux.tar.gz" \
    && curl -fsSL "$BINARYEN_BIN_URL" -o binaryen.tar.gz \
    && tar -xzf binaryen.tar.gz --directory / \
    && cp -r /binaryen-version_105/* /usr/ \
    && chmod -R o+r /usr/bin/wasm-opt \
    && rm -rf binaryen.tar.gz binaryen-version_105

# Verify binaryen version
RUN wasm-opt --version

# Install Node.js
RUN set -e; \
    curl -fsSL "https://deb.nodesource.com/setup_16.x" | bash - \
    && apt-get install -y nodejs

# Verify node version
RUN node --version

# Clean up
RUN set -e; \
    apt-get purge --auto-remove -y curl

# Install build app
ADD src ./src
COPY *.json ./
RUN npm install
RUN npm run build
RUN npm install --production

# Set entry point
CMD [ "node", "./bin/fargate.js" ]
