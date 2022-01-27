FROM amazonlinux:2

FROM amazon/aws-cli:latest

RUN aws --version

RUN yum -y install \
  binutils \
  gcc \
  git \
  glibc-static \
  gzip \
  libbsd \
  libcurl \
  libedit \
  libicu \
  libsqlite \
  libstdc++-static \
  libuuid \
  libxml2 \
  tar \
  tzdata \
  zlib-devel

RUN set -e; \
    curl --silent --location https://rpm.nodesource.com/setup_16.x | bash - \
    && yum -y install nodejs

RUN node --version

RUN set -e; \
    curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo \
    && rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg \
    && yum install -y yarn

RUN yarn --version

RUN set -e; \
    SWIFT_BIN_URL="https://pick-n-shovel.s3.amazonaws.com/swift-wasm-DEVELOPMENT-SNAPSHOT-amazonlinux2_x86_64.tar.gz" \
    && curl -fsSL "$SWIFT_BIN_URL" -o swift.tar.gz \
    && tar -xzf swift.tar.gz --directory / --strip-components=1 \
    && chmod -R o+r /usr/lib/swift \
    && rm -rf swift.tar.gz

RUN swift --version

ADD src ./src

COPY *.json *.lock ./

RUN yarn install

RUN yarn build

CMD [ "node", "bin/fargate.js" ]
