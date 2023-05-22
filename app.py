from flask import Flask, redirect, render_template, session, request, Markup, url_for
from flask_mail import Mail, Message
from flask_session import Session
from cs50 import SQL
from functions import *
from creds import *
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.secret_key = FLASK_SECRET_KEY
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["MAIL_SERVER"] = "smtp.office365.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = EMAIL
app.config["MAIL_PASSWORD"] = APP_PASSWORD
db = SQL("sqlite:///accounts.db")
mail = Mail(app)
Session(app)
limiter = Limiter(key_func=get_remote_address)
limiter.init_app(app)


@app.route("/", methods=["GET"])
def index():
    if not "username" in session:
        return redirect(url_for("login"))
    return render_template("index.html")


@app.route("/login", methods=["POST", "GET"])
@limiter.limit("5 per minute")
def login():
    if request.method == "POST":
        username, password = request.form.get(
            "username"), request.form.get("password")
        if bool(db.execute("SELECT id FROM users WHERE username = ? AND password = ?", username, hash(password))):
            session["username"] = username
            if not bool(db.execute("SELECT is_verified FROM users WHERE username = ?", username)[0]['is_verified']):
                session["email"] = db.execute(
                    "SELECT email FROM users WHERE username = ?", username)
            return redirect(url_for("loader"))
        else:
            Flashes("wrongCredentials")
    return render_template("login.html")


@app.route("/loader", methods=["GET"])
def loader():
    return render_template("loader.html")


@app.route("/signup", methods=["POST", "GET"])
@limiter.limit("5 per minute")
def signup():
    if request.method == "POST":
        username, email, password = request.form.get(
            "username"), request.form.get("email"), request.form.get("password")
        if bool(db.execute("SELECT username FROM users WHERE username = ?", username)):
            Flashes("usernameTaken")
        elif bool(db.execute("SELECT email FROM users WHERE email = ?", email)):
            Flashes("emailTaken")
        elif not password_matches_pattern(password):
            Flashes("passwordNotSecure")
        else:
            db.execute("INSERT INTO users(username, password, email, is_verified) VALUES(?, ?, ?, ?)",
                       username, hash(password), email, 0)
            return redirect(url_for("verify_email", email=email, username=username))
    return render_template("signup.html")


@app.route("/verify_email/<email>/<username>", methods=["GET"])
@limiter.limit("5 per minute")
def verify_email(email, username):
    token = generate_token(app, email, "verify-email")
    reset_url = request.url_root + "verify/" + username + "/" + token
    msg = Message("Verify Email", sender=EMAIL, recipients=[email])
    msg.body = f"Click the link below to verify your email: {reset_url}"
    mail.send(msg)
    Flashes("verificationLinkSent")
    return redirect(url_for("index"))


@app.route("/verify/<username>/<token>", methods=["GET"])
@limiter.limit("5 per minute")
def verify(username, token):
    email = verify_token(app, token, "verify-email")
    if not email:
        Flashes("emailNotVerified")
        return redirect(url_for("index"))
    else:
        db.execute(
            "UPDATE USERS SET is_verified = ? WHERE username = ?", 1, username)
        if "email" in session:
            session["email"] = None
        Flashes("emailVerified")
        return redirect(url_for("index"))


@app.route("/logout", methods=["GET"])
def logout():
    session["username"] = None
    return redirect(url_for("login"))


@app.route("/update_password", methods=["GET", "POST"])
def update_password():
    if not "username" in session:
        return redirect(url_for("login"))
    if request.method == "POST":
        username, old_password, new_password = request.form.get(
            "username"), request.form.get("old_password"), request.form.get("new_password")
        if not bool(db.execute("SELECT id FROM users WHERE username = ? AND password = ?", username, hash(old_password))):
            Flashes("wrongCredentials")
        elif old_password == new_password:
            Flashes("passwordMatch")
        elif not password_matches_pattern(new_password):
            Flashes("passwordNotSecure")
        else:
            db.execute("UPDATE users SET password = ? WHERE username = ?", hash(
                new_password), username)
            Flashes("successfulPasswordReset")
            return redirect(url_for("index"))
    return render_template("update_password.html")


@app.route("/reset_password", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def reset_password():
    if request.method == "POST":
        email = request.form["email"]
        token = generate_token(app, email, "reset-password")
        reset_url = request.url_root + "reset/" + token
        msg = Message("Password Reset", sender=EMAIL, recipients=[email])
        msg.body = f"Click the link below to reset your password: {reset_url}"
        mail.send(msg)
        Flashes("passwordResetLinkSent")
        return redirect(url_for("index"))
    return render_template("reset_password.html")


@app.route("/reset/<token>", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def reset(token):
    email = verify_token(app, token, "reset-password")
    if not email:
        Flashes("invalidResetLink")
        return redirect(url_for("index"))
    if request.method == "POST":
        username, password = request.form.get(
            "username"), request.form.get("password")
        if not bool(db.execute("SELECT id FROM users WHERE username = ?", username)):
            Flashes("usernameNotFound")
        elif not password_matches_pattern(password):
            Flashes("passwordNotSecure")
        else:
            db.execute("UPDATE users SET password = ? WHERE username = ?", hash(
                password), username)
            Flashes("successfulPasswordReset")
            return redirect(url_for("index"))
    return render_template("reset.html", token=token)


@app.route("/delete", methods=["GET"])
def delete():
    if not "username" in session:
        return redirect(url_for("login"))
    db.execute("DELETE FROM users WHERE username = ?", session["username"])
    session["username"] = None
    Flashes("accountDeleted")
    return redirect(url_for("login"))


@app.route("/change_email/<username>", methods=["GET", "POST"])
def change_email(username):
    if not "username" in session:
        return redirect(url_for("login"))
    if request.method == "POST":
        new_email = request.form.get("new_email")
        return redirect(url_for("verify_email", email=new_email, username=username))
    return render_template("change_email.html")


@app.errorhandler(404)
def page_not_found(error):
    return render_template("error-pages/404.html"), 404


@app.errorhandler(429)
def handle_rate_limited(error):
    return render_template("error-pages/429.html"), 429


@app.errorhandler(500)
def internal_server_error(error):
    return render_template("error-pages/500.html"), 500


@app.errorhandler(Exception)
def handle_exception(error):
    app.logger.error(str(error))
    return render_template("error-pages/error.html"), 500
