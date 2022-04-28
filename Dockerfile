FROM ubuntu:20.04

LABEL maintainer="SwiftWasm Maintainers <hello@swiftwasm.org>"
LABEL Description="Docker Container for the SwiftWasm toolchain and SDK"
LABEL org.opencontainers.image.source https://github.com/swiftwasm/swiftwasm-docker

RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true && apt-get -q update && \
    apt-get -q install -y \
    curl \
    gnupg \
    libcurl4 \
    libxml2 \
    tzdata \
    && rm -r /var/lib/apt/lists/*

ARG SWIFT_TAG=swift-wasm-5.6.0-RELEASE
ENV SWIFT_PLATFORM_SUFFIX=ubuntu20.04_x86_64.tar.gz
ENV SWIFT_TAG=$SWIFT_TAG

RUN set -e; \
    SWIFT_BIN_URL="https://github.com/swiftwasm/swift/releases/download/$SWIFT_TAG/$SWIFT_TAG-$SWIFT_PLATFORM_SUFFIX" \
    && export DEBIAN_FRONTEND=noninteractive \
    && curl -fsSL "$SWIFT_BIN_URL" -o swift.tar.gz \
    && tar -xzf swift.tar.gz --directory / --strip-components=1 \
    && chmod -R o+r /usr/lib/swift \
    && rm -rf "$GNUPGHOME" swift.tar.gz

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

# Install build app
COPY src ./src
COPY *.json *.ts ./
RUN set -e; \
    npm install && \
    npm run build && \
    npm cache clean --force && \
    rm -rf node_modules src *.json *.ts

# Cleanup
RUN set -e; \
    apt-get purge --auto-remove -y curl gnupg

# Set entry point
CMD [ "node", "./bin/fargate.js" ]
