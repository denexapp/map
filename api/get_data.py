import json
import os
import pandas as pd
from googleapiclient.discovery import build
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def __init__(self):
        self.GoogleSheetsApiKey = os.environ['GOOGLE_SHEETS_API_KEY']
        self.ranges = ['A:C']

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        
        spreadsheet_id = str(self.rfile.read(int(self.headers.get('Content-Length'))))
        service = build('sheets', 'v4', developerKey=self.GoogleSheetsApiKey)
        request = service.spreadsheets().values().batchGet(
            spreadsheetId=spreadsheet_id,
            ranges=self.ranges
        )
        response = request.execute()
        response_values = response.get('valueRanges', list())[0].get('values', list())
        response_df = pd.DataFrame(response_values[1:], columns=response_values[0]).rename(columns={'ФИО': 'name'})
        response_df['address'] = response_df['Страна'].str.lower().str.strip() + ' ' + \
            response_df['Город'].str.lower().str.strip()
        result = json.dumps({'values': response_df[['name', 'address']].to_dict('records')}, ensure_ascii=False)
        self.wfile.write(result.encode())
        return
