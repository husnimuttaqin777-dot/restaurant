from flask import Flask, render_template, request, redirect, session, url_for

app = Flask(__name__)
app.secret_key = "rahasia_super"

# halaman table (bebas)
@app.route("/")
def table():
    return render_template("table_fix.html")


# halaman login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        # contoh login sederhana
        if username == "chef" and password == "123":
            session["login"] = True
            return redirect("/kitchen")

    return render_template("login.html")


# halaman kitchen (harus login)
@app.route("/kitchen")
def kitchen():
    if not session.get("login"):
        return redirect("/login")

    return render_template("kitchen/index.html")


# logout
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8081,
        debug=False,
        use_reloader=False
    )