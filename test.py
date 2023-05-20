from cs50 import SQL

db = SQL('sqlite:///accounts.db')

username = 'johndoe'

is_verified = db.execute("SELECT is_verified FROM users WHERE username = ?", username)[0]['is_verified']

if bool(is_verified):
    print("User is verified")
else: 
    print("User is not verified")