FROM centos:centos7
MAINTAINER Junbin Gao

# Fix CentOS 7 repository issue by using vault mirrors
RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*.repo && \
    sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*.repo

# install web server
RUN yum install -y httpd php mysql mysql-server

#TODO config mysql to support login

# Remove default Apache welcome page
RUN rm -f /etc/httpd/conf.d/welcome.conf

# Set ServerName to suppress warning
RUN echo "ServerName localhost" >> /etc/httpd/conf/httpd.conf

# Create html directory
RUN mkdir -p /var/www/html

# Copy and set up entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# expose tcp:80 port
EXPOSE 80

# Use entrypoint script
CMD ["/entrypoint.sh"]
