/*
* Flocking WebAudio Strategy
* http://github.com/colinbdclark/flocking
*
* Copyright 2013, Colin Clark
* Dual licensed under the MIT and GPL Version 2 licenses.
*/

/*global Float32Array, AudioContext, webkitAudioContext*/
/*jslint white: true, vars: true, undef: true, newcap: true, regexp: true, browser: true,
    forin: true, continue: true, nomen: true, bitwise: true, maxerr: 100, indent: 4 */

var fluid = fluid || require("infusion"),
    flock = fluid.registerNamespace("flock");

(function () {
    "use strict";
    
    /**
     * Web Audio API Audio Strategy
     */
    fluid.defaults("flock.enviro.webAudio", {
        gradeNames: ["fluid.modelComponent", "autoInit"],
        mergePolicy: {
            genFn: "nomerge",
            nodes: "nomerge",
            buses: "nomerge"
        }
    });
    
    flock.enviro.webAudio.finalInit = function (that) {
        that.audioSettings = that.options.audioSettings;
        that.buses = that.options.buses;
        that.nodes = that.options.nodes;
        that.gen = that.options.genFn;
        
        that.startGeneratingSamples = function () {
            that.jsNode.onaudioprocess = that.writeSamples; // TODO: When Firefox ships, is this still necessary?
            that.jsNode.connect(that.context.destination);
        };
        
        that.stopGeneratingSamples = function () {
            that.jsNode.disconnect(0);
            that.jsNode.onaudioprocess = undefined;
        };
        
        that.writeSamples = function (e) {
            // TODO: Do all these settings need to be read every time onaudioprocess gets called?
            var kr = that.audioSettings.rates.control,
                playState = that.model,
                chans = that.audioSettings.chans,
                bufSize = that.audioSettings.bufferSize,
                numKRBufs = bufSize / kr,
                sourceBufs = that.buses,
                outBufs = e.outputBuffer;
                
            // If there are no nodes providing samples, write out silence.
            if (that.nodes.length < 1) {
                for (chan = 0; chan < chans; chan++) {
                    flock.generate.silence(outBufs.getChannelData(chan));
                }
                return;
            }

            for (var i = 0; i < that.model.krPeriods; i++) {
                that.gen();
                var offset = i * kr;

                // Loop through each channel.
                for (var chan = 0; chan < chans; chan++) {
                    var sourceBuf = sourceBufs[chan],
                        outBuf = outBufs.getChannelData(chan);
                    
                    // And output each sample.
                    for (var samp = 0; samp < kr; samp++) {
                        outBuf[samp + offset] = sourceBuf[samp];
                    }
                }
            }
            
            playState.written += bufSize * chans;
            if (playState.written >= playState.total) {
                that.stop();
            }
        };
        
        that.init = function () {
            var settings = that.audioSettings;
            that.model.krPeriods = settings.bufferSize / settings.rates.control;
            
            // Singleton AudioContext since the WebKit implementation
            // freaks if we try to instantiate a new one.
            if (!flock.enviro.webAudio.audioContext) {
                flock.enviro.webAudio.audioContext = new flock.enviro.webAudio.contextConstructor();
            }
            that.context = flock.enviro.webAudio.audioContext;
            that.source = that.context.createBufferSource();
            that.jsNode = that.context.createJavaScriptNode(settings.bufferSize);
            that.source.connect(that.jsNode);
        };
        
        that.init();
    };
    
    flock.enviro.webAudio.contextConstructor = window.AudioContext || window.webkitAudioContext;
    
    fluid.demands("flock.enviro.audioStrategy", "flock.platform.webAudio", {
        funcName: "flock.enviro.webAudio"
    });

}());