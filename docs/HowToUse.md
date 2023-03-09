# How to use

## How to use GPU timer query

Effekseer has a function to measure the gpu time of rendering.
To use this function, you need to set several properties to the `settings` object as a second argument for the `init` method like this:

```js
effekseerContext.init(webGLRenderingContext, {
    enableTimerQuery: true, // enable GPU timer query
    onTimerQueryReport: (nanoTime) => { // called when GPU timer query is reported
        console.log(`Effekseer timer query report: ${nanoTime} ns`);
    },
    timerQueryReportIntervalCount: 60, // interval dray count to report GPU timer query
});
```

## Support Premultiplied alpha

You need to specify enablePremultipliedAlpha in settings to render as Premultiplied alpha

```js
context.init(webGLRenderingContext, { enablePremultipliedAlpha: true });
```

## How to use with Threee.js PostProcessing

Please read this code

https://github.com/effekseer/EffekseerForWebGL/blob/master/tests/post_processing_threejs.html
