import os
import yt_dlp
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# 🔑 Bot Key
BOT_TOKEN = "7740121377:AAHHD8dzKBW0nkAVhnKHMgjctFaVadPm4GI"

# ⚙️ Config
OUT_FOLDER = "downloads"
TELEGRAM_LIMIT = 50 * 1024 * 1024   # 50MB (free account) – change to 2*1024*1024*1024 for premium


# 🎬 Download video with yt-dlp
def download_video(url: str):
    if not os.path.exists(OUT_FOLDER):
        os.makedirs(OUT_FOLDER)

    ydl_opts = {
        "outtmpl": f"{OUT_FOLDER}/%(title)s.%(ext)s",
        "format": f"best[filesize<={TELEGRAM_LIMIT}] / best",  # ✅ Try to stay under limit
        "quiet": True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info)
        return file_path


# 📩 Start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Send me a video link 🎥, I'll try to download and send it back.")


# 📩 Handle messages
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    await update.message.reply_text("⏳ Downloading... Please wait.")

    try:
        file_path = download_video(url)
        file_size = os.path.getsize(file_path)

        if file_size <= TELEGRAM_LIMIT:  
            # ✅ Small enough → send as video
            try:
                await update.message.reply_video(video=open(file_path, "rb"))
            except:
                # if can't send as video → send as document
                await update.message.reply_document(document=open(file_path, "rb"))
        else:
            # ❌ Too large for Telegram → send as link
            abs_path = os.path.abspath(file_path)
            await update.message.reply_text(
                f"⚠️ File is too big for Telegram!\n"
                f"✅ Saved at: `{abs_path}`\n\n"
                f"You can download it directly from the server."
            )

        os.remove(file_path)  # cleanup
    except Exception as e:
        await update.message.reply_text(f"⚠️ Error: {str(e)}")


# 🚀 Main
def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🤖 Bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
