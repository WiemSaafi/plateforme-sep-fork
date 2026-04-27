from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.documents import Utilisateur

SECRET_KEY = "sep_platform_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 heures

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)  # ✅ ne lève pas d'erreur si absent

def hasher_mot_de_passe(mot_de_passe: str) -> str:
    return pwd_context.hash(mot_de_passe)

def verifier_mot_de_passe(mot_de_passe: str, hash: str) -> bool:
    return pwd_context.verify(mot_de_passe, hash)

def creer_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def _decoder_token(token: str) -> Utilisateur:
    """Décode un token JWT et retourne l'utilisateur. Lève HTTPException si invalide."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    user = await Utilisateur.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    if user.statut != "actif":
        raise HTTPException(status_code=403, detail="Compte non actif")
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Utilisateur:
    """Auth standard via header Authorization: Bearer <token>"""
    return await _decoder_token(credentials.credentials)


async def get_current_user_optional(
    request: Request,
    token_query: Optional[str] = Query(None, alias="token"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> Utilisateur:
    """
    Auth flexible pour Niivue et autres clients qui ne peuvent pas
    envoyer de headers custom.
    Accepte le token depuis :
      1. Query param  : ?token=xxx        (utilisé par Niivue)
      2. Header       : Authorization: Bearer xxx  (utilisé par axios)
    """
    token = None

    # Priorité 1 : query param ?token=
    if token_query:
        token = token_query
    # Priorité 2 : header Authorization
    elif credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(status_code=401, detail="Token manquant")

    return await _decoder_token(token)


def require_role(*roles):
    async def checker(user: Utilisateur = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Accès refusé. Rôle requis : {', '.join(roles)}"
            )
        return user
    return checker
