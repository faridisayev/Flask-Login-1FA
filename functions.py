from hashlib import sha256
from flask import flash
from re import match
from itsdangerous import URLSafeTimedSerializer

# string encoder


def hash(string):
    return sha256(string.encode('utf-8')).hexdigest()


def Flashes(message):
    match message:

        # error messages
        case "input":
            return flash("Please fill all fields before submission", "error")
        case "wrongCredentials":
            return flash("Username or password is wrong", "error")
        case "usernameTaken":
            return flash("Username is already taken", "error")
        case "emailTaken":
            return flash("This email is already used", "error")
        case "passwordNotSecure":
            return flash("Password should be 8 characters long, contain at least 1 uppercase, 1 lowercase, 1 digit and 1 special character", "error")
        case "emailNotVerified":
            return flash("Email was not verified", "error")
        case "passwordMatch":
            return flash("Old password and new password should not match", "error")
        case "invalidResetLink":
            return flash("The password link is not valid or has expired", "error")
        case "usernameNotFound":
            return flash("The username is not found", "error")

        # info messages
        case "verificationLinkSent":
            return flash("A message containing verification link has been sent to your email", "info")
        case "emailVerified":
            return flash("Email was verified", "info")
        case "successfulPasswordReset":
            return flash("Your password has been successfully reset", "info")
        case "passwordResetLinkSent":
            return flash("An email with instructions to reset your password has been sent", "info")
        case "accountDeleted":
            return flash("Your account was successfully deleted", "info")
        case _:
            return flash("Unknown message")

# password security controller


def password_matches_pattern(password, pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-_=+[\]{}|;:,.<>/?`]).{8,}$"):
    return match(pattern, password)

# token generator


def generate_token(app, email, salt):
    serializer = URLSafeTimedSerializer(app.secret_key)
    return serializer.dumps(email, salt)

# token verifier


def verify_token(app, token, salt, expiration=3600):
    serializer = URLSafeTimedSerializer(app.secret_key)
    try:
        email = serializer.loads(token, salt=salt, max_age=expiration)
        return email
    except:
        return None
