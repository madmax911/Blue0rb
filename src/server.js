/*

Author:  Max Calcagno
License:  MIT
Project:  Blue0rb - A light-weight NodeJS test web server with client/server reset button - supports injection.
                    YOU control when the page and server are reloaded.

                    This can be used to enhance or test static web sites with a NodeJS back-end.

****************************************************************************************************************************/

const TestMode = true; // Will display a Reset Server button right on the page.  Enjoy  ;-) -- Max Calcagno
const PortNum = process.env['PORT'] || 8000;

const default_home = "home";  // Subfolder for static web content - should not be blank [security]
const default_index = "/index.html";
const client_reload_delay_ms = 300;
const ServerMimeTypesAry = require('./mime.json');

const additional_html_text = "";  // optional resource injection points.
const additional_css_text = "";
const additional_js_text = "";

/*------------------------------------------*/

const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');

console.log(`Visit http://localhost:${PortNum}`);

http.createServer
(
  (req, resp) =>
  {
    let path = url.parse(req.url).path; // String:  /index.html?name=Max&favoritefood=pizza&favoritedrink=pepsi
    let pathname = url.parse(req.url).pathname; // String:  /index.html
    pathname = pathname.replace(/\/{2,}/,'/');  // Replace stacked forward slashes ///// with a single /

    let params = qs.parse(url.parse(req.url).query); // Array:  params['name'] = "Max", etc...

    if (pathname === "/")
    {
      pathname = default_index;
    }

    if (TestMode && params['QuitServer'] === '1') // Reset server if browser hits reset button and in TestMode
    {
      resp.writeHead(200, {'Content-Type': 'text/html'});
      resp.write
      (
        "<script> setTimeout('window.open(\""
        + path.replace("?QuitServer=1", "").replace("&QuitServer=1", "")
        + "\", \"_self\")', " + client_reload_delay_ms + "); </script> Reloading..." // , then reload client page
                                                          //   after 300ms giving server time to restart.
      );
      resp.end();
      process.exit(); // Exits node - don't worry shell script will loop back and reload it.
    }
    else
    {
      let file_ext = pathname.split(".")[1] = pathname.split('.')[pathname.split('.').length - 1];
      let file_mime = ServerMimeTypesAry[file_ext] || 'application/octet-stream';  // file extension -> mime type
      let file_mime_type = file_mime.split('/')[0];
      let file_mime_subtype = file_mime.split('/')[1];
      let readFile_path = default_home + '/' + pathname.substr(1);

      console.log(`Reading file '${process.cwd()}/${readFile_path}'`);

      fs.readFile // Reads the file from disk as specified in the path part of the url (index.html).
      (
        readFile_path,
        (err, data) =>
        {
          if (err)
          {
            // console.log(err);
            resp.writeHead(404, {'Content-Type': 'text/html'});
            resp.end();
          }
          else
          {
            let fileText = data.toString();
            resp.writeHead(200, {'Content-Type': file_mime});
            
            if (file_mime_type === 'image') // This is sort of like a hierarchial handler for mime types
            {
              if (file_mime_subtype === 'svg+xml')
              {
                resp.write(data);
              }
              else
              {
                resp.write(data, 'binary');
              }
            }
            else if (file_mime_type === 'text')
            {
              if (file_mime_subtype === 'html')
              {
                if (TestMode) // Insert reset server button if in TestMode.
                {
                  fileText = fileText.replace("<body>", "<body>\n<div id=\"RstBtn\" "      // Inserts Button after "<body>"
                      + " style=\"position:absolute; top:0px; left:300px; opacity:0.7;\">"
                      + " <input type=\"button\" name=\"ResetServer\" value=\"Reload page and server\" "
                      +    "onclick=\"let q = (document.location.toString().indexOf('?') === -1) ? '?' : '&'; "
                      +              "window.open(document.location + q + 'QuitServer=1', '_self')\"></div>");
                }
                
                resp.write( fileText.replace("<body>", "<body>\n" + additional_html_text + "\n") );  // Inject html
              }
              else if (file_mime_subtype === 'css')
              {
                resp.write( fileText + '\n' + additional_css_text );  // Inject css
              }
              else if (file_mime_subtype === 'javascript')
              {
                resp.write( fileText + '\n' + additional_js_text );  // Inject JavaScript
              }
              else
              {
                resp.writeHead(200, {'Content-Type': 'text/plain'});
                resp.write( fileText );
              }
            }
            else
            {
              resp.write(data, 'binary');
            }
          }
          resp.end();
        }
      );
    }
  }
).listen(PortNum);

