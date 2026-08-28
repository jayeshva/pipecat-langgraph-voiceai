FROM alpine:3.19

# Install Asterisk PBX with PJSIP and AudioSocket support
RUN apk add --no-cache \
    asterisk \
    asterisk-sample-config \
    asterisk-sounds-en \
    curl \
    bash

# Copy configuration files into /etc/asterisk
COPY config/asterisk.conf /etc/asterisk/asterisk.conf
COPY config/pjsip.conf /etc/asterisk/pjsip.conf
COPY config/extensions.conf /etc/asterisk/extensions.conf
COPY config/manager.conf /etc/asterisk/manager.conf

# Expose SIP UDP (5060), RTP media range (10000-10099), and AMI (5038)
EXPOSE 5060/udp 5038/tcp 10000-10099/udp

# Run Asterisk in foreground
CMD ["/usr/sbin/asterisk", "-f", "-c"]
