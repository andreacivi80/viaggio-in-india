from pathlib import Path

from pypdf import PdfReader, PdfWriter


root = Path(__file__).resolve().parents[1]
source = root / "tests" / "fixtures" / "documento-prova.pdf"
target = root / "tests" / "fixtures" / "documento-prova-protetto.pdf"

reader = PdfReader(source)
writer = PdfWriter()
writer.clone_document_from_reader(reader)
writer.encrypt(user_password="india-test", owner_password="india-test-owner", algorithm="AES-256")
with target.open("wb") as stream:
    writer.write(stream)

verification = PdfReader(target)
if not verification.is_encrypted:
    raise RuntimeError("La fixture PDF non risulta cifrata")
if verification.decrypt("password-errata") != 0:
    raise RuntimeError("La fixture accetta una password errata")
if verification.decrypt("india-test") == 0 or len(verification.pages) < 1:
    raise RuntimeError("La fixture non si apre con la password prevista")

print(f"PROTECTED_PDF={target}")
