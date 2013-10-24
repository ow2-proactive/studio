nginx setup for development
===========================

When accessing the studio on localhost, you might see the following
error in the browser console:

    XMLHttpRequest cannot load
    http://localhost:8080/rest/validate. Origin http://localhost is
    not allowed by Access-Control-Allow-Origin.

One way to avoid it without reconfiguring the rest api sever is to
configure nginx on localhost to both serve the studio and serve as a
proxy to the rest API. Example nginx config:

    $ cat /etc/nginx/sites-enabled/studio

    server {
        listen 80 default_server;

        root /usr/share/nginx/html;
        index index.html index.htm;
        server_name localhost;
        try_files $uri $uri/ /index.html;

        location /studio {
            alias /home/user/proactive/repos/studio/;
            autoindex on;
            allow 127.0.0.1;
        }

        location /rest {
            proxy_pass http://127.0.0.1:8080;    
        }

    }

