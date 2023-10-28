// ==UserScript==
// @name        Auto Complete iLeaner
// @namespace   Violentmonkey Scripts
// @match       *://*.i-learner.com.hk/*
// @grant       none
// @version     1.0
// @author      Li Bryan
// @description Complete i-Learner automatically. Only MCs can be done correctly.
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
// @grant       window.close
// ==/UserScript==

(function () {
    'use strict';

    const clickedRandom = function () {
        let config = GM_getValue("config");
        config.randomDelay = $(this).prop('checked');
        GM_setValue("config", config);
    };

    const openTab = function () {
        let notDone = $('table').find("tr").filter(function (_) {
            let progress = $($(this).find("td")[2]).text().split('/');
            return !($(this).find("a").length === 0 || progress[0] === progress[1]);
        });
        if (notDone.length === 0) {
            window.alert('This page is finished, please navigate to the next page.');
            return;
        }
        let disabled = GM_getValue("config").disabled;
        function tab(index) {
            if (index === notDone.length) {
                window.location.reload();
                return;
            };
            if (disabled) return;
            let element = notDone[index];
            let url = $(element).find("a").attr("href");
            let tabControl = GM_openInTab(url, { active: false, insert: true, });
            tabControl.onclose = function () { tab(++index); };
        };
        tab(0)
    };

    const disable = function () {
        let config = GM_getValue("config");
        config.disabled = $(this).prop('checked');
        GM_setValue("config", config);
    };

    const doMC = function (randomDelay) {
        return new Promise(function doMC(resolve) {
            let counter = 0;
            $(".each_choices").each(function () {
                var obj = $(this);
                var sub_id = $(this).attr('name').split("c_")[1];
                var content = $(this).attr('value');

                $.ajax({
                    type: "POST",
                    url: "ajax.php",
                    data: "act=get_MC_ans&sub_id=" + sub_id + "&value=" + content,

                    success: function (result) {
                        counter++;
                        if (result == content) {
                            var target_div = obj.attr('div_id');

                            $("#" + target_div).css({ "background": "#90F7B9", "color": "#333" });
                            obj.css({ "color": "#333" });
                            $("#" + target_div).trigger("click");
                        }
                        if (counter === $('.each_choices').length) {
                            if (randomDelay) {
                                let delay = Math.floor(
                                    (Math.random() * 5 + 0.5) * 1000
                                );
                                let panel = $(`<aside style='position:fixed;top:50px;left:0px;background-color:white;padding:10px;border:1px solid;max-width:400px;z-index:99999;'><div><h1 id=\"timer\">Delay: ${delay}ms</h1></div>`);
                                panel.appendTo("body");
                                new Promise(res => setTimeout(res, delay)).then(end);
                            } else {
                                end();
                            }

                            const end = function () {
                                try {
                                    checkAnswer();
                                } finally {
                                    console.log('%cSubmitted! ', 'color: #00FF00; font-size: large');
                                    $('html, body').animate({
                                        scrollTop: 0
                                    }, 100);
                                    resolve();
                                }
                            }
                        }
                    }
                });
            });
        });
    };

    if (!GM_getValue("config")) {
        GM_setValue("config", { randomDelay: false });
    }
    let panel;
    if (window.location.href.includes("htmlexercise")) {
        if (GM_getValue("config").disabled) {
            return;
        };
        let nextURL = null;
        let a = $('a[href*="guwen_ex.php"]')
        if (!window.location.href.includes("guwen_ex.php")) {
            window.location.href = $(a[0]).attr("href");
            return;
        }
        const config = GM_getValue("config");
        console.log("random delay:", config.randomDelay);
        function nextPage() {
            a.each(function (i) {
                let aURL = new URL($(this).attr("href"), window.location);
                if (window.location.href.includes(aURL)) {
                    if (++i < a.length) {
                        nextURL = new URL($(a[i]).attr("href"), window.location);
                        return false;
                    }
                }
            });
            if (nextURL) {
                window.location.href = nextURL.href;
                return;
            } else {
                window.close();
                return;
            }
        }
        if ($("form")[0].id.includes("frm_ex_exercise_mc")) {
            doMC(config.randomDelay).then(nextPage);
        } else {
            try {
                checkAnswer();
            } finally {
                console.clear();
                console.log('%cSubmitted! ', 'color: #00FF00; font-size: large');
                $('html, body').animate({
                    scrollTop: 0
                }, 100);
            }
        }
    } else if (window.location.href.includes("report")) {
        panel = $("<aside style='position:fixed;top:50px;left:0px;background-color:white;padding:10px;border:1px solid;max-width:400px;z-index:99999;'><div><h2>AutoCompleteiLearner panel</h2><input type=\"checkbox\" id=\"randomDelay\" name=\"randomDelay\" ><label for=\"random\">&ensp;Submit answers with a slight and random delay</label><br><input type=\"checkbox\" id=\"disable\" value=\"Disable\"><label for=\"disable\">&ensp;Disable</label><br><input type=\"button\" id=\"start\" value=\"Start\"><br></div>");
        panel.find("input#randomDelay").prop("checked", GM_getValue("config").randomDelay);
        panel.appendTo("body");
        panel.find('input#start').on("click", openTab);
        panel.find('input#disable').on("click", disable);
        panel.find('input#random').on("click", clickedRandom);
        console.log('appended panel');
    } else {
        panel = $("<aside style='position:fixed;top:50px;left:0px;background-color:white;padding:10px;border:1px solid;max-width:400px;z-index:99999;'><div><h2>The plugin is activated. Please log in and navigate to 我的成績表</h2></div>");
        panel.appendTo("body");
    }
})();