import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

load_dotenv()

app = FastAPI(title="Thai Province Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    data: list = []

CATEGORY_KEYWORDS = {
    "สถานที่เที่ยว": ["สถานที่เที่ยว", "ที่เที่ยว", "เที่ยว", "ที่เที่ยว", "สถานที่ท่องเที่ยว", "ท่องเที่ยว", "สถานที่น่าเที่ยว"],
    "ร้านอาหาร": ["ร้านอาหาร", "อาหาร", "ร้านกับข้าว", "กิน", "ทาน", "ร้านข้าว", "แนะนำร้านอาหาร"],
    "งานประจำปี": ["งานประจำปี", "งานเทศกาล", "เทศกาล", "งาน", "ประเพณี", "งานวัด"],
    "ที่พัก": ["ที่พัก", "โรงแรม", "รีสอร์ท", "ห้องพัก", "โฮสเทล"],
    "ของฝาก": ["ของฝาก", "ของที่ระลึก", "สินค้า", "ของดี"],
}

PROVINCES = [
    "สุราษฎร์ธานี", "เชียงใหม่", "กรุงเทพมหานคร", "ภูเก็ต", "ขอนแก่น", "ชลบุรี",
    "เชียงราย", "นครราชสีมา", "อุดรธานี", "หาดใหญ่", "สงขลา", "ปัตตานี", "นครศรีธรรมราช",
    "สุโขทัย", "พิษณุโลก", "อยุธยา", "กาญจนบุรี", "ระยอง", "ตราด", "จันทบุรี",
    "นครนายก", "ปราจีนบุรี", "สระแก้ว", "สมุทรปราการ", "สมุทรสาคร", "นนทบุรี",
    "ปทุมธานี", "อ่างทอง", "ลพบุรี", "สิงห์บุรี", "ชัยนาท", "สุพรรณบุรี",
    "เพชรบุรี", "ประจวบคีรีขันธ์", "ชุมพร", "ระนอง", "พังงา", "กระบี่",
    "ตรัง", "พัทลุง", "สตูล", "ยะลา", "นราธิวาส", "บึงกาฬ", "หนองคาย",
    "เลย", "หนองบัวลำภู", "สกลนคร", "นครพนม", "มุกดาหาร",
    "อำนาจเจริญ", "อุบลราชธานี", "ยโสธร", "ศรีสะเกษ", "สุรินทร์", "บุรีรัมย์",
    "มหาสารคาม", "ร้อยเอ็ด", "กาฬสินธุ์", "นครสวรรค์", "อุทัยธานี", "ชัยภูมิ",
    "พิจิตร", "เพชรบูรณ์", "แพร่", "น่าน", "พะเยา",
    "ลำปาง", "ลำพูน", "แม่ฮ่องสอน", "ตาก", "กำแพงเพชร",
]

def extract_keywords(text: str) -> tuple:
    category = None
    province = None

    for cat, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                category = cat
                break
        if category:
            break

    for p in PROVINCES:
        if p in text:
            province = p
            break

    return category, province

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message
    category, province = extract_keywords(message)

    if not category or not province:
        return ChatResponse(
            reply="ฟ้ามืดไม่เข้าใจคำถามครับ กรุณาลองถามใหม่โดยระบุจังหวัดและหมวดหมู่ เช่น 'มีสถานที่เที่ยวไหนในจังหวัดสุราษฎร์ธานี'",
            data=[]
        )

    try:
        result = supabase.table("suratthani").select("*").ilike("category", f"%{category}%").ilike("province", f"%{province}%").execute()
        
        if result.data:
            return ChatResponse(
                reply=f"พบ {len(result.data)} รายการสำหรับ '{category}' ในจังหวัด{province} ครับ",
                data=result.data
            )
        else:
            return ChatResponse(
                reply=f"ขออภัยครับ ไม่พบข้อมูล '{category}' ในจังหวัด{province} ครับ",
                data=[]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
