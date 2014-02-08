/*
 * Flocking Playground
 *   Copyright 2014, Colin Clark
 *
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

/*global require, window*/

var fluid = fluid || require("infusion"),
    flock = fluid.registerNamespace("flock");

(function () {
    "use strict";
    
    var $ = fluid.registerNamespace("jQuery");
    
    /**************
     * Playground *
     **************/
    
    fluid.defaults("flock.playground", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        flockingSettings: {},
        
        components: {
            demos: {
                type: "flock.playground.demos"
            },
            
            editor: {
                type: "flock.ui.codeEditor.cm",
                container: "{that}.dom.editor",
            },
            
            demoSelector: {
                type: "flock.playground.demoSelector",
                container: "{that}.dom.demoSelector",
                options: {
                    listeners: {
                        afterDemoLoaded: [
                            {
                                funcName: "{editor}.setContent",
                                args: ["{arguments}.0"]
                            }
                        ]
                    }
                }
            },
            
            playButton: {
                type: "flock.ui.enviroPlayButton",
                container: "{that}.dom.playButton"
            }
        },
        
        events: {
            onEvaluateDemo: "{playButton}.events.onPlay"
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "{demoSelector}.loadDemoFromURL"
                },
                {
                    funcName: "flock.init",
                    args: "{that}.options.flockingSettings"
                }
            ],
            
            onEvaluateDemo: {
                funcName: "flock.playground.evaluateDemo",
                args: [{
                    expander: {
                        funcName: "{editor}.getContent"
                    }
                }]
            }
        },

        selectors: {
            editor: "#editorRegion",
            playButton: "#playButton",
            demoSelector: "#demos"
        }
    });
    
    flock.playground.evaluateDemo = function (code) {
        var synthSpec;
        
        try {
            synthSpec = JSON.parse(code);
            return flock.synth(synthSpec);
        } catch (e) {
            fluid.log("Invalid JSON while parsing synthDef: " + code);
        }
    };
    
    /*****************
     * Demo Selector *
     *****************/
    
    fluid.defaults("flock.playground.demoSelector", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        components: {
            selectBox: {
                type: "flock.ui.selectBox",
                container: "{that}.container",
                options: {
                    model: "{demos}.model"
                }
            }
        },
        
        defaultURLSpec: {
            pathPrefix: "../demos/",
            fileExt: "json"
        },
        
        invokers: {
            loadDemo: {
                funcName: "flock.playground.demoSelector.load",
                args: ["{arguments}.0", "{that}.options.defaultURLSpec", "{that}.events.afterDemoLoaded.fire"]
            },
            
            loadDemoFromURL: {
                funcName: "flock.playground.demoSelector.loadDemoFromURLHash",
                args: ["{that}.container", "{selectBox}", "{that}.loadDemo"]
            },
            
            updateURL: {
                funcName: "flock.playground.demoSelect.updateURLHash",
                args: ["{arguments}.0.id"]
            }
        },
        
        events: {
            onDemoSelected: null,       // Fires when the user selects a demo.
            afterDemoLoaded: null       // Fires after a demo file has been loaded.
        },
        
        listeners: {
            onDemoSelected: [
                {
                    funcName: "{that}.updateURL",
                    args: ["{arguments}.0"]
                },
                {
                    funcName: "{that}.loadDemo",
                    args: ["{arguments}.0"]
                }
            ]
        }
    });
    
    flock.playground.demoSelector.updateURLHash = function (id) {
        if (id) {
            window.location.hash = "#" + id;
        }
    };
    
    flock.playground.demoSelector.loadDemoFromURLHash = function (container, selectBox, onDemoSelected) {
        var id = window.location.hash;
        if (id) {
            id = id.slice(1);
        } else {
            id = selectBox.model.defaultOption;
        }
        
        selectBox.select(id);
        onDemoSelected(id);
    };
    
    flock.playground.demoSelector.load = function (demo, defaultURLSpec, afterDemoLoaded) {
        var url = demo.url || (defaultURLSpec.pathPrefix + demo + "." + defaultURLSpec.fileExt);
        
        $.ajax({
            type: "get",
            url: url,
            dataType: "text",
            success: afterDemoLoaded,
            error: function (xhr, textStatus, errorThrown) {
                throw new Error(textStatus + " while loading " + url + ": " + errorThrown);
            }
        });
    };
    
}());
