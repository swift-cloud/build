FROM ubuntu:20.04

LABEL maintainer="Swift Cloud <hello@swift.cloud>"
LABEL Description="Docker Container for the Swift Cloud build pipeline"

# Install required deps for swift
RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true && apt-get -q update && \
    apt-get -q install -y \
    binutils \
    curl \
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

# Install swift
RUN set -e; \
    SWIFT_BIN_URL="https://swift-cloud-toolchains.s3.amazonaws.com/swift-wasm-5.6-SNAPSHOT-2022-03-23-a-ubuntu20.04_x86_64.tar.gz" \
    && export DEBIAN_FRONTEND=noninteractive \
    && curl -fsSL "$SWIFT_BIN_URL" -o swift.tar.gz \
    && tar -xzf swift.tar.gz --directory / --strip-components=1 \
    && chmod -R o+r /usr/lib/swift \
    && rm -rf swift.tar.gz

# Verify swift version
RUN swift --version

# Install Node.js
RUN set -e; \
    curl -fsSL "https://deb.nodesource.com/setup_16.x" | bash - \
    && apt-get install -y nodejs

# Verify node version
RUN node --version

# Install yarn
RUN set -e; \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt update && apt install yarn

# Verify yarn version
RUN yarn --version

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

# Install build app
ADD src ./src
COPY *.json *.lock ./
RUN yarn install --frozen-lockfile
RUN yarn build

# Set entry point
CMD [ "node", "./bin/fargate.js" ]
