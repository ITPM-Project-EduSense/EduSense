import sys
import asyncio
from app.services.chat_service import process_coach_document

class MockFile:
    filename = 'test.pdf'
    async def read(self):
        return b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'

async def run():
    try:
        res = await process_coach_document(MockFile(), '69bf99e6a18a', 'General')
        print(res)
    except Exception:
        import traceback
        traceback.print_exc()

asyncio.run(run())
