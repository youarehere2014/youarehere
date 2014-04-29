# "You Are Here"

This is a prototype of an interactive story designed and built as part of [Tribeca Hacks <Mobile>](http://tribecafilm.com/innovation/tribeca-hacks) during the 2014 Tribeca Film Festival.

"You Are Here" presents the story of "Alice in Wonderland" visualized as illustrated panoramic photos with music and audio narration. There are three locations in downtown Manhattan, each of which is associated with a different panorama and audio track.

All planning, story, code and art were created in two days. Expect it to break.

## Locations

You can visit the three locations in the West Village of Manhattan in New York City (though one of them is behind a locked door in the back yard of a private office building, so good luck with that). As an alternative, the Chrome Developer Tools will you allow you to [override geolocation](https://developers.google.com/chrome-developer-tools/docs/mobile-emulation#device-geolocation-overrides).

- [Bleecker Playground](https://www.google.com/maps/place/Bleecker+Playground/@40.7362738,-74.0056037,20z/data=!4m2!3m1!1s0x0:0x689c1c9bf46d0590) (40.736416, -74.005542)
- [725 Washington St.](https://www.google.com/maps/place/40%C2%B044%2709.7%22N+74%C2%B000%2728.4%22W/@40.7359318,-74.0081079,20z/data=!4m3!3m2!1s0x0:0x0!4b1) (40.736416, -74.005542)
- [726 Washington St.](https://www.google.com/maps/place/726+Washington+St/@40.7358593,-74.0086358,19z/data=!4m2!3m1!1s0x89c259eb109b5081:0xa05044a81838e30d) (40.735843, -74.008680)

## Team

- [Brian Chirls](http://chirls.com)
- [Jimmy Ferguson](http://jwjferguson.com/)
- [Vandana Premkumar](https://twitter.com/VandanaHacking)
- [Cara Shih](http://whoisshih.com/)
- [Isaac Woodruff](http://www.isaacwoodruff.com/)

## Technology

"You Are Here" is primarily built as a web site, using standard and widely implemented web APIs. Though it is intended as primarily a mobile experience, it also works on desktop browsers.

There is also a "wearable" component, not included here, built with the [Pebble Smartwatch](https://getpebble.com/).

### Tools and APIs
- [Geolocation API](https://developer.mozilla.org/en-US/docs/WebAPI/Using_geolocation)
- [Device Orientation API](https://developer.mozilla.org/en-US/docs/WebAPI/Detecting_device_orientation)
- WebGL and [Seriously.js](https://github.com/brianchirls/Seriously.js/)
- [SimpleJS](http://simplyjs.io/), Javascript API for Pebble

## Browser Compatibility

As a prototype, this work is rather temperamental and prone to fail in certain environments. It is best experienced in Chrome. On mobile devices, panoramas can be explored by moving the device; in desktop browsers, pan around with the mouse.

### Chrome (Android and Desktop)

Works pretty well, but geolocation services can be a bit unpredictable. Audio may not play on mobile.

### Firefox (Android and Desktop)

Firefox also works pretty well. Device orientation might be a bit off, since the API is somewhat immature and may behave slightly differently from Chrome. Audio may not play on certain operating systems, since we only included mp3.

### Internet Explorer

I have no idea, since we never tried it. But IE 11 supports WebGL, Geolocation and Device Orientation, so it might work.