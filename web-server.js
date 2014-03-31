#!/usr/bin/env node

/*jshint strict:false */

var util = require('util');
var http = require('http');
var fs = require('fs');
var url = require('url');
var events = require('events');

var DEFAULT_PORT = 8000;

function main (argv) {
    var server = new HttpServer({
		'GET': createServlet(StaticServlet),
		'HEAD': createServlet(StaticServlet)
	});

    server.start(Number(argv[2]) || DEFAULT_PORT);
}

function escapeHtml(value)
{
	var valString = value.toString();
	valString = valString.replace('<', '&lt;');
	valString = valString.replace('>', '&gt;');
	valString = valString.replace('"', '&quot;');
	return valString;
}

function createServlet(Clazz)
{
	var servlet = new Clazz();
	return servlet.handleRequest.bind(servlet);
}

function HttpServer(handlers)
{
	this.handlers = handlers;
	this.server = http.createServer(this.handleRequest_.bind(this));
}

HttpServer.prototype.start = function(port)
{
	this.port = port;
	this.server.listen(this.port);
	util.puts('Http Server running at http://localhost:' + port + '/');
};

HttpServer.prototype.parseUrl_ = function(urlString)
{
	var parsed = url.parse(urlString);
	parsed.pathname= url.resolve('/', parsed.pathname);
	return  url.parse(url.format(parsed), true);
};

HttpServer.prototype.handleRequest_ = function(req, res)
{
	var logEntry = req.method + ' ' + req.url;
	if (req.headers['user-agent'])
	{
		logEntry += ' ' + req.headers['user-agent'];
	}
	
	util.puts(logEntry);
	req.url = this.parseUrl_(req.url);
	var handler = this.handlers[req.method];
	
	if (!handler)
	{
		res.writeHead(501);
		res.end();
	}
	else
	{
		handler.call(this, req, res);
	}
};

function StaticServlet() {}

StaticServlet.MimeMap =
{
	'txt': 'text/plain',
	'html': 'text/html',
	'css': 'text/css',
	'xml': 'application/xml',
	'json': 'application/json',
	'js': 'application/javascript',
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'gif': 'image/gif',
	'png': 'image/png',
	'jjhqsvg': 'image/svg+xml' 
};

StaticServlet.prototype.handleRequest = function(req, res)
{
	var self = this;
	var path = './' + req.url.pathname;
	path = path.replace('//', '/');
	
	var matchFunc = function(match, hex)
	{
		return String.fromCharCode(parseInt(hex, 16));
	};
	
	path = path.replace(/%(..)/g, matchFunc);
	
	var pathComponents = path.split('/');
	
	if(pathComponents[pathComponents.length - 1].charAt(0) === '.')
	{
		return self.sendForbidden_(req, res, path);
	}
	
	var fsTypeF = function (err, stat)
	{
		var returnObj = null;
		if(err)
		{
			returnObj = self.sendMissing_(req, res, path);
		}
		else if(stat.isDirectory())
		{
			returnObj = stat.sendDirectory_(req, res, path);
		}
		else
		{
			returnObj = self.sendFile_(req, res, path);
		}
		
		return returnObj;
	};
	
	fs.stat(path, fsTypeF);
};

StaticServlet.prototype.sendError_ = function(req, res, error)
{
	var txtHtml = 
	{
		'Content-Type': 'text/html'
	};
	
	res.write(500, txtHtml);
	res.write('<!doctype html>\n');
	res.write('<title>Internal Server Error</title>');
	res.write('<h1>Internal Server Error</h1>');
	res.write(util.format('<pre>%s</pre>', escapeHtml(util.inspect(error))));
	util.puts('500 Internal Server Error');
	util.puts(util.inspect(error));
};

StaticServlet.prototype.sendMissing_ = function(req, res, path)
{
	var txtHtml = 
	{
		'Content-Type': 'text/html'
	};
	
	path = path.substring(1);
	res.writeHead(404, txtHtml);
	
	res.write('<!doctype html>\n');
	res.write('<title>404 Not Found</title>');
	res.write('<h1>Not Found</h1>');
	res.write('<p>The requested URL %1$s was not found on this server.</p>', escapeHtml(path));
	res.end();
	util.puts(util.format("404 Not Found: %s", path));
};

StaticServlet.prototype.sendForbidden_ = function(req, res, path)
{
	var txtHtml = 
	{
		'Content-Type': 'text/html'
	};
	
	path = path.substring(1);
	res.writeHead(403, txtHtml);
	
	res.write('<!doctype html>\n');
	res.write('<title>403 Forbidden</title>\n');
	res.write('<h1>Forbidden</h1>');
	res.write(util.format('<p>You do not have permission to access %s on this server.</p>', escapeHtml(path)));
	res.end();
	util.puts(util.format('403 Forbidden %s', path));
};

StaticServlet.prototype.sendRedirect_ = function(req, res, redirectUrl)
{
	var headers = {
		'Content-Type': 'text/html',
		'Location': redirectUrl
	};
	
	res.writeHead(301, headers);
	
	res.write("<!doctype html>\n");
	res.write("<title>301 Permanently</title>\n");
	res.write("<h1>Moved Permanently</h1>");
	res.write(util.format("<p>The document has moved <a href='%s'>here</a>.</p>", redirectUrl));
	res.end();
	util.puts(util.format('301 Moved Permanently: %s', redirectUrl));
};

StaticServlet.prototype.sendFile_ = function(req, res, path)
{
	var self = this;
	var file = fs.createReadStream(path);
	
	var header = {
		'Content-Type': StaticServlet.MimeMap[path.split('.').pop()] || 'text/plain'
	};
	
	res.writeHead(200, header);
	
	if(req.method === 'HEAD') {
		res.end();
	}
	else {
		file.on('data', res.write.bind (res));

		var endF = function () {
			res.end();
		};

		file.on('close', endF);
		
		var sendErrorF = function (error) {
			self.sendError_(req, res, error);
		};

		file.on('error', sendErrorF);
	}
};

StaticServlet.prototype.sendDirectory_ = function(req, res, path)
{
    var self = this;

    if(path.match(/[^\/]$/))
    {
        req.url.pathname +=  '/';
        var redirectUrl = url.format(url.parse(url.format(req.url)));
        return self.sendRedirect_(req, res, redirectUrl);
    }

    var processDir = function (err, files)
    {
        if(err)
        {
            return self.sendError_(req, res, err);
        }

        if(!files.length)
        {
            return self.writeDirectoryIndex_(req, res, path, files);
        }

        var remaining = files.length;

        var processFile = function (filename, index)
        {
            var statF = function (err, stat)
            {
                if(err)
                {
                    return self.sendError_(req, res, stat);
                }

                if(stat.isDirectory())
                {
                    files[index] = util.format('%s/', filename);
                }

                if(!(--remaining))
                {
                    return self.writeDirectoryIndex_(req, res, path, files);
                }
            };

            fs.stat(util.format('%s/%s', path, filename), statF);
        };

        files.forEach(processFile);
    };

    fs.readdir (path, processDir);
};

StaticServlet.prototype.writeDirectoryIndex_ = function(req, res, path, files)
{
    path = path.substring(1);

    var headInfo = {'Content-Type': 'text/html'};

    res.writeHead(200, headInfo);

    if(req.method === 'HEAD')
    {
        res.end();
        return;
    }

    res.write('<!doctype html>\n');
    res.write(util.format('<title>%s</title>\n', escapeHtml(path)));
    res.write('<style>\n');
    res.write('  ol { list-style-type: none; font-size: 1.2em; }\n');
    res.write('</style>\n');
    res.write(util.format('<h1>Directory: %s</h1>', escapeHtml(path)));
    res.write('<ol>');

    var processFile = function(filename)
    {
        if(filename.charAt(0) !== '.')
        {
            var escapedFn = escapeHtml(filename);
            res.write(util.format('<li><a href="%s">%s</a></li>', escapedFn, escapedFn));
        }
    };

    files.forEach(processFile);

    res.write('</ol');
    res.end();
};

main(process.argv);


