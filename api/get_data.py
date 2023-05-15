import json
import os
from googleapiclient.discovery import build
from http.server import BaseHTTPRequestHandler
import re


class handler(BaseHTTPRequestHandler):
    def normalize_string(input_string):
        # Trim leading and trailing spaces
        trimmed_string = input_string.strip()
        # Remove repeating spaces
        no_repeating_spaces = re.sub(r'\s+', ' ', trimmed_string)
        # Transform to lowercase
        lowercase_string = no_repeating_spaces.lower()
        return lowercase_string

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

        # One name can occur more than once, in which case we use the last value - this is a temporary current location
        name2address = dict()
        for name, country, city in response_values[1:]:
            normalized_name = self.normalize_string(name)
            name2address[normalized_name] = country.lower().strip() + ' ' + city.lower().strip()
        result = [{'name': name, 'address': address} for name, address in name2address.items()]
        result = json.dumps({'values': result}, ensure_ascii=False)
        self.wfile.write(result.encode())
        return
