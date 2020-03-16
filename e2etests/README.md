# Running tests locally

## Installation
```
$ sudo npm install -g nightwatch
```

Then run Selenium:
```
$ docker run -d -p 4444:4444 -p 5900:5900 -v /dev/shm:/dev/shm selenium/standalone-chrome-debug:3.12.0-cobalt
```

If you prefer Firefox:
```
$ docker run -d -p 4444:4444 -p 5900:5900 -v /dev/shm:/dev/shm selenium/standalone-firefox-debug:3.12.0-cobalt
```

IMPORTANT: some operations might fail in one browser or another (Selenium is not very robust) so it pays to check against different browsers.

If you want to observe the tests as they are happening, you need a VNC client, for example:
```
$ sudo apt-get install vinagre
```

Nightwatch is configured to connect to Selenium server at `selenium` in this project, so we must edit `/etc/hosts` and add line:
```
127.0.0.1    selenium
```

## Running

```
$ cd e2etests/
$ EOB_URL="https://apps.sentinel-hub.com/eo-browser/" \
  EOB_LOGIN_USER="user@sinergise.com" \
  EOB_LOGIN_PASS="asdf123" \
  nightwatch . -o /tmp/nwreports
```

To observe tests via VNC, connect with VNC client to 127.0.0.1 port 5900.