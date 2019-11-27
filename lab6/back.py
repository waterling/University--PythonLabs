from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs
from urllib.parse import urlparse

import feedparser
from bson.json_util import dumps, loads
from bson.objectid import ObjectId
from pymongo import MongoClient


class RecordsHTTPServer(BaseHTTPRequestHandler):
    def do_GET(self, rsss, db):
        params = parse_qs(urlparse(self.path).query)
        page = int(params['page'][0])
        size = int(params['size'][0])
        rss_id = params['rss'][0]
        rss = rsss.find_one({'_id': ObjectId(rss_id)})
        response = '{{"records":{0}, "pagination":{1}}}'
        if rss is None:
            print('rss {} not found'.format(rss_id))
        else:
            records = db['{}_records'.format(rss_id)]
            all_records = list(records.find())
            for record in all_records:
                del record['_id']
            total = len(all_records)
            pagination = '{{"page":{0}, "size":{1}, "total":{2}}}'.format(page, size, total)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if page * size > total:
                self.wfile.write(bytes(response.format(dumps(all_records), pagination), encoding='utf-8'))
            else:
                self.wfile.write(
                    bytes(response.format(dumps(all_records[(page * size):(page * size + size)]), pagination),
                          encoding='utf-8'))

    def do_RELOAD(self, rsss, db):
        rss_id = parse_qs(urlparse(self.path).query)['rss'][0]
        rss = rsss.find_one({'_id': ObjectId(rss_id)})
        if rss is None:
            print('rss {} not found'.format(rss_id))
        else:
            records = db['{}_records'.format(rss_id)]
            new_records = feedparser.parse(rss['url'])['entries']
            for record in new_records:
                if 'id' not in record:
                    record['id'] = record['link']
                if records.find_one({'id': record['id']}) is None:
                    records.insert_one(
                        {"id": record['id'], "link": record['link'], "published": record['published'],
                         "summary": record['summary']})
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(bytes("{}", encoding='utf-8'))


class TypesHTTPServer(RecordsHTTPServer):
    def do_GET(self):
        client = MongoClient('localhost', 27017)
        db = client['rss-scroller']
        rsss = db['rsss']

        try:
            if self.path.startswith('/get-rss-list'):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(bytes(dumps(rsss.find()), encoding='utf-8'))

            if self.path.startswith('/get-records'):
                RecordsHTTPServer.do_GET(self, rsss, db)

            if self.path.startswith('/reload-rss'):
                RecordsHTTPServer.do_RELOAD(self, rsss, db)

            return
        except IOError:
            self.send_error(404, 'Not Found: %s' % self.path)

    def do_POST(self):
        client = MongoClient('localhost', 27017)
        db = client['rss-scroller']
        rsss = db['rsss']
        if self.path.startswith('/add-rss'):
            self.add_rss(rsss, loads(self.rfile.read(int(self.headers['Content-Length'])).decode("utf-8")))
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(bytes(dumps(rsss.find()), encoding='utf-8'))

    def add_rss(self, _rsss, rss):
        if _rsss.find_one({'url': rss['url'], 'title': rss['title']}) is None:
            _rsss.insert_one(rss)


def run():
    httpd = HTTPServer(('192.168.43.94', 8080), TypesHTTPServer)
    print('Application successfully started')
    httpd.serve_forever()


if __name__ == '__main__':
    run()

