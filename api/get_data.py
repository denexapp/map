import json
import os
from googleapiclient.discovery import build
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()

        GoogleSheetsApiKey = os.environ['GOOGLE_SHEETS_API_KEY']
        ranges = ['A:C']

        spreadsheet_id = (self.rfile.read(int(self.headers.get('Content-Length')))).decode('utf-8')
        service = build('sheets', 'v4', developerKey=GoogleSheetsApiKey)
        request = service.spreadsheets().values().batchGet(
            spreadsheetId=spreadsheet_id,
            ranges=ranges
        )
        response = request.execute()
        response_values = response.get('valueRanges', list())[0].get('values', list())
        result = \
            [{'name': x[0], 'address': x[1].lower().strip() + ' ' + x[2].lower().strip()} for x in response_values[1:]]
        result = json.dumps({"values": result}, ensure_ascii=False)
        self.wfile.write(result.encode())
        return
