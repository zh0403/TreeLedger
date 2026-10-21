from functools import lru_cache
from supabase import Client, create_client
from app.core.config import settings


@lru_cache
def get_supabase_client() -> Client:
    clean_url = settings.SUPABASE_URL.split("/rest/v1")[0].rstrip("/")
    return create_client(clean_url, settings.SUPABASE_KEY)


supabase: Client = get_supabase_client()
