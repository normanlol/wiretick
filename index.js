const TikTokScraper = require("tiktok-scraper");
const http = require("http");
const url = require("url");
const fs = require("fs");
const got = require("got");
const cheerio = require("cheerio");
if (!fs.existsSync("./config.json")) {
    console.log("[WARN] 'config.json' does not exist! copying 'config.example.json' to fix this!")
    fs.copyFileSync("config.example.json", "config.json")
}
const config = JSON.parse(fs.readFileSync("./config.json"));
const port = process.env.PORT || config.port;
http.createServer(runServer).listen(port);

console.log("- wiretick is running! (listening to port " + port + ")");
async function runServer(request, resp) {
    var u = url.parse(request.url, true);
    var path = u.pathname;
    var param = u.query;
    var path_parsed = path.split("/");
    if (path_parsed[1] == "api") {
        if (path_parsed[2] == "user") {
            try {
                if (path_parsed[3]) {
                    var uu = path_parsed[3]
                } else {
                    var d = JSON.stringify({
                        "err": "moreDataNeeded"
                    });
                    resp.writeHead(404, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(d);
                    return;
                }
                var user = await TikTokScraper.getUserProfileInfo(uu);
                var video = await TikTokScraper.user(uu, {number: 100});
                var d = JSON.stringify({user, video});
                resp.writeHead(200, {
                    "Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            } catch (error) {
                var d = JSON.stringify({
                    "err": error
                });
                resp.writeHead(404, {
                    "Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            }
        } else if (path_parsed[2] == "trending") {
            try {
                var posts = await TikTokScraper.trend('', { number: 50 });
                posts = JSON.stringify(posts);
                resp.writeHead(200, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                })
                resp.end(posts);
            } catch (error) {
                var d = JSON.stringify({
                    "err": error
                });
                resp.writeHead(404, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            }
        } else if (path_parsed[2] == "tag") {
            try {
                if (path_parsed[3]) {
                    var hashtag = await TikTokScraper.getHashtagInfo(path_parsed[3]);
                    var hashtagContent = await TikTokScraper.hashtag(path_parsed[3], {number: 100});
                } else {
                    var d = JSON.stringify({
                        "err": "moreDataNeeded"
                    });
                    resp.writeHead(404, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(d);
                    return;
                }
                var d = JSON.stringify({hashtag, hashtagContent});
                resp.writeHead(200, {
                    "Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            } catch (error) {
                var d = JSON.stringify({
                    "err": error
                });
                resp.writeHead(404, {
                    "Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            }
        } else if (path_parsed[2] == "post") {
            try {
                if (param.url) {
                    var videoMeta = await TikTokScraper.getVideoMeta(param.url);
                    if (videoMeta.collector[0]) { var videoMeta = {
                        "meta": videoMeta.collector[0],
                        "cookie": videoMeta.headers["Cookie"]
                    }} 
                    videoMeta = JSON.stringify(videoMeta);
                    resp.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(videoMeta);
                } else {
                    var d = JSON.stringify({
                        "err": "moreDataNeeded"
                    });
                    resp.writeHead(404, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(d);
                }
            } catch (error) {
                var d = JSON.stringify({
                    "err": error
                });
                resp.writeHead(404, {
                    "Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            }
        } else if (path_parsed[2] == "tune") {
            try {
                if (path_parsed[3]) {
                    var music = await TikTokScraper.music(path_parsed[3], {number: 100});
                    if (music.collector[0]) {
                        var musicInfo = music.collector[0].musicMeta;
                    } else {
                        var musicInfo = {};
                    }
                    var d = JSON.stringify({music, musicInfo});
                    resp.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(d);
                } else {
                    var d = JSON.stringify({
                        "err": "moreDataNeeded"
                    });
                    resp.writeHead(404, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(d);
                }
            } catch (error) {
                var d = JSON.stringify({
                    "err": error
                });
                resp.writeHead(404, {
                    "Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
                })
                resp.end(d);
            }
        } else {
            var d = JSON.stringify({
                "err": "invalidEndpoint"
            });
            resp.writeHead(404, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            })
            resp.end(d);
        }
    } else if (path_parsed[1].substring(0, 1) == "@" && path_parsed[2] == "video") {
        fs.readFile("./web-content/post/index.html", async function(err,res) {
            if (err) {
                resp.end("see console for errors");
                console.log("incomplete installation has occured.")
            } else {
                var $ = cheerio.load(res);
                try {
                    var videoMeta = await TikTokScraper.getVideoMeta("https://www.tiktok.com" + path);
                    var img = "/proxy/" + btoa(videoMeta.collector[0].imageUrl) + "?cookie=" + btoa(videoMeta.headers["Cookie"]);
                    var vid = "/proxy/" + btoa(videoMeta.collector[0].videoUrl) + "?cookie=" + btoa(videoMeta.headers["Cookie"]);
                    $("#authLink").attr("href", "/@" + videoMeta.collector[0].authorMeta.name);
                    $("#auth").text(videoMeta.collector[0].authorMeta.name);
                    $("#musiLink").attr("href", "/tune/" + videoMeta.collector[0].musicMeta.musicId);
                    $("#musi").text(videoMeta.collector[0].musicMeta.musicName + " - " + videoMeta.collector[0].musicMeta.musicAuthor);
                    $("#li").text(videoMeta.collector[0].diggCount.toLocaleString());
                    $("#vi").text(videoMeta.collector[0].playCount.toLocaleString());
                    $("#sh").text(videoMeta.collector[0].shareCount.toLocaleString());
                    $("#content").text(videoMeta.collector[0].text);
                    $("title").text(videoMeta.collector[0].text + " | WireTick");
                    $("video").attr("poster", img);
                    $("video").attr("src", vid);
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    })
                    resp.end($.html());
                } catch (error) {
                    $("#err").attr("style", "");
                    $("#page").attr("style", "display:none;");
                    $("#errTxt").text(error);
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    })
                    resp.end($.html());
                }
                
            }
        })
    } else if (path_parsed[1].substring(0, 1) == "@") {
        fs.readFile("./web-content/creator/index.html", async function(err,res) {
            if (err) {
                resp.end("see console for errors");
                console.log("incomplete installation has occured.")
            } else {
                var $ = cheerio.load(res);
                try {
                    var user = await TikTokScraper.getUserProfileInfo(path.substring(2));
                    var video = await TikTokScraper.user(path.substring(2), {number: 100});
                    $("#authName").text(user.user.uniqueId);
                    $("#videoCount").text(user.stats.videoCount.toLocaleString());
                    $("#followerCount").text(user.stats.followerCount.toLocaleString());
                    $("#followingCount").text(user.stats.followingCount.toLocaleString());
                    $("#totalLikes").text(user.stats.heartCount.toLocaleString());
                    $("#authPfp").attr("src", "/proxy/" + btoa(user.user.avatarMedium));
                    $("title").text(user.user.uniqueId + " | WireTick");
                    for (var c in video.collector) {
                        var imgsrc = '"/proxy/' + btoa(video.collector[c].covers.origin) + '"';
                        var dynsrc = '"/proxy/' + btoa(video.collector[c].covers.dynamic) + '"';
                        var elem = "<a href='" + video.collector[c].webVideoUrl.split("https://www.tiktok.com")[1] + "'><img src=" + imgsrc + " onmouseover='this.src = " + dynsrc +"' onmouseout='this.src = " + imgsrc +"'></a>";
                        $("#feed").append(elem);
                    }
                } catch (error) {
                    $("#err").attr("style", "");
                    $("#profile").attr("style", "display:none;");
                    $("#errTxt").text(error);
                }
                resp.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/html"
                })
                resp.end($.html());
            }
        })
    } else if (path_parsed[1] == "music") {
        if (!path_parsed[2]) {
            fs.readFile("./error/404.html", function(err, res) {
                if (err) {
                    resp.end("see console for errors");
                    console.log("incomplete installation has occured.")
                } else {
                    resp.writeHead(404, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    })
                    resp.end(res);
                }
            })
        } else {
            var id = path_parsed[2].toString().split("-")[path_parsed[2].toString().split("-").length - 1];
            var redirPath = "/tune/" + id
            resp.writeHead(302, {
                "Location": redirPath
            })
            resp.end();
        }
    } else if (path_parsed[1] == "tune") {
        if (!path_parsed[2]) {
            fs.readFile("./error/404.html", function(err, res) {
                if (err) {
                    resp.end("see console for errors");
                    console.log("incomplete installation has occured.")
                } else {
                    resp.writeHead(404, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    })
                    resp.end(res);
                }
            })
        } else if (path_parsed[2] == "index.js") {
            fs.readFile("./web-content/tune/index.js", function(err,res) {
                if (err) {
                    resp.end("see console for errors");
                    console.log("incomplete installation has occured.");
                } else {
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/javascript"
                    })
                    resp.end(res);
                }
            })
        } else {
            fs.readFile("./web-content/tune/index.html", async function(err,res) {
                if (err) {
                    resp.end("see console for errors");
                    console.log("incomplete installation has occured.");
                } else {
                    var $ = cheerio.load(res);
                    try {
                        var id = path.split("/tune/")[1].split("/")[0]
                        var music = await TikTokScraper.music(id, {number: 100});
                        if (music.collector[0]) {
                            var musicInfo = music.collector[0].musicMeta;
                        } else {
                            var musicInfo = {};
                        }
                        $("#title").text(musicInfo.musicName);
                        $("title").text(musicInfo.musicName + " | WireTick")
                        $("#authorName").text(musicInfo.musicAuthor);
                        $("#cover").attr("src", "/proxy/" + btoa(musicInfo.coverMedium))
                        for (var c in music.collector) {
                            var imgsrc = '"/proxy/' + btoa(music.collector[c].covers.origin) + '"';
                            var dynsrc = '"/proxy/' + btoa(music.collector[c].covers.dynamic) + '"';
                            var elem = "<a href='" + music.collector[c].webVideoUrl.split("https://www.tiktok.com")[1] + "'><img src=" + imgsrc + " onmouseover='this.src = " + dynsrc +"' onmouseout='this.src = " + imgsrc +"'></a>";
                            $("#feed").append(elem);
                        }
                    } catch (error) {
                        $("#err").attr("style", "");
                        $("#profile").attr("style", "display:none;");
                        $("#errTxt").text(error);
                    }
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    })
                    resp.end($.html());
                }
            })
        }
    } else if (path_parsed[1] == "proxy") {
        if (path_parsed[2]) {
            try {
                var a = "";
                for (var c in path_parsed.slice(2)) {
                    if (c == 0) {var a = path_parsed.slice(2)[c];} else {var a = a + "/" + path_parsed.slice(2)[c]}
                }
                var ur = Buffer.from(a, "base64").toString("utf-8");
                if (param.cookie) {
                    var h = {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36",
                        "Referer": "https://www.tiktok.com/",
                        "Cookie": Buffer.from(param.cookie, "base64").toString("utf-8")
                    }
                } else {
                    var h = {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36',
                        Referer: 'https://www.tiktok.com/'
                    }
                }
                var d = got.stream(ur, {
                    headers: h
                }).on("close", function() {
                    resp.end();
                }).on("error", function(e) {
                    resp.end();
                })
                d.pipe(resp)
            } catch (error) {
                if (error.message) {
                    resp.writeHead(404, {
                        "Content-Type": "text/plain"
                    })
                    resp.end(error.message);
                } else {
                    resp.writeHead(404, {
                        "Content-Type": "text/plain"
                    })
                    resp.end(error);
                }
            }
        } else {
            resp.writeHead(404, {
                "Content-Type": "text/plain"
            })
            resp.end("must have url");
        }
    } else if (path == "/") {
        fs.readFile("./web-content/index.html", async function (err, res) {
            if (err) {
                resp.end("see console for errors");
                console.log("incomplete installation has occured.");
            } else {
                var $ = cheerio.load(res);
                try {
                    var posts = await TikTokScraper.trend('', { number: 50 });
                    for (var c in posts.collector) {
                        var auth = "<h2><span class='material-icons'>person</span> " + posts.collector[c].authorMeta.name +"</h2>";
                        var mus = "<h2><span class='material-icons'>headset</span> " + posts.collector[c].musicMeta.musicName +"</h2>";
                        var d = new Date(posts.collector[c].createTime * 1000);
                        var month = d.getMonth();
                        var day = d.getDate();
                        var year = d.getFullYear();
                        if (d.getHours() >= 13) {
                            var ap = "pm";
                            var hour = d.getHours() - 12;
                        } else {
                            if (d.getHours == 0) {
                                var hour = 12; 
                                var ap = "am"
                            } else {
                                var ap = "am";
                                var hour = d.getHours();
                            }
                        }
                        if (d.getSeconds().toString().length == 1) {var sec = "0" + d.getSeconds();} else {var sec = d.getSeconds();}
                        if (d.getMinutes().toString().length == 1) {var min = "0" + d.getMinutes();} else {var min = d.getMinutes();}
                        var str =  month + "/" + day + "/" + year + " at " + hour + ":" + min + ":" + sec + ap;
                        var post = "<h2><span class='material-icons'>date_range</span> posted on " + str +"</h2>";
                        var views = "<h2><span class='material-icons'>visibility</span> " + posts.collector[c].playCount.toLocaleString() + " views</h2>";
                        var likes = "<h2><span class='material-icons'>thumb_up</span> " + posts.collector[c].diggCount.toLocaleString() + " likes</h2>";
                        var shar = "<h2><span class='material-icons'>reply</span> " + posts.collector[c].shareCount.toLocaleString() + " shares</h2>";
                        var p = "<p>" + posts.collector[c].text + "</p>"
                        var inf = auth + mus + post + views + likes + shar + p;
                        var chip = "<a href='" + posts.collector[c].webVideoUrl.split("https://www.tiktok.com")[1] + "'><div><img src='/proxy/" + btoa(posts.collector[c].covers.dynamic) + "'><div class='infoBox'>" + inf + "</div></div></a>"
                        $("#feed").append(chip)
                    }
                } catch (error) {
                    $("#err").attr("style", "");
                    $("#home").attr("style", "display:none");
                    $("#errTxt").text(error);
                }
                resp.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/html"
                })
                resp.end($.html());
            }
        })
    } else {
        fs.readFile("./web-content/" + path, function(err, res) {
            if (err) {
                if (err.code == "EISDIR") {
                    fs.readFile("./web-content/" + path + "/index.html", function(err, res) {
                        if (err) {
                            if (err.code == "ENOENT") {
                                fs.readFile("./error/404.html", function(err, res) {
                                    if (err) {
                                        resp.end("see console for errors");
                                        console.log("incomplete installation has occured.")
                                    } else {
                                        resp.writeHead(404, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "text/html"
                                        })
                                        resp.end(res);
                                    }
                                })
                            }
                        } else {
                            resp.writeHead(200, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/html"
                            })
                            resp.end(res);
                        }
                    })
                } else if (err.code == "ENOENT") {
                    fs.readFile("./error/404.html", function(err, res) {
                        if (err) {
                            resp.end("see console for errors");
                            console.log("incomplete installation has occured.")
                        } else {
                            resp.writeHead(404, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/html"
                            })
                            resp.end(res);
                        }
                    })
                } else {
                    resp.end("please report this error to the developers - " + err.code);
                }
            } else {
                var fileType = path.split(".")[path.split(".").length - 1];
                if (fileType == "html") {
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    })
                    resp.end(res);
                } else if (fileType == "js") {
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/javascript"
                    })
                    resp.end(res);
                } else if (fileType == "css") {
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/css"
                    })
                    resp.end(res);
                } else {
                    resp.writeHead(200, {
                        "Access-Control-Allow-Origin": "*"
                    })
                    resp.end(res);
                }
            }
        })
    }
}

function btoa(a) {
    // Encode in Base64
    return Buffer.from(a, "utf-8").toString("base64");
}

function atob(a) {
    // Decode in Base64
    return Buffer.from(a, "base64").toString("utf-8");
}