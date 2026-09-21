import React, { useEffect, useState } from "https://esm.sh/react@19.1.1";
import { createRoot } from "https://esm.sh/react-dom@19.1.1/client";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const h = React.createElement;
const supabase = createClient(
  "https://rspaatjoyxshafysqjgz.supabase.co",
  "sb_publishable_YkgMBdptgk6uMAy5pZHqyw_lx12ysdm",
);

function Field({ label, children }) {
  return h("label", null, label, children);
}

function App() {
  const [session, setSession] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [authMode, setAuthMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBusy(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setSubjects([]);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadSubjects();
  }, [session]);

  async function loadSubjects() {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase
      .from("subjects")
      .select("id,name,description,color,created_at")
      .order("created_at", { ascending: false });

    if (error) setMessage("読み込みに失敗しました: " + error.message);
    else setSubjects(data ?? []);
    setBusy(false);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const result = authMode === "signUp"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.href.split("#")[0] },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (authMode === "signUp" && !result.data.session) {
      setMessage("確認メールを送りました。メール内のリンクを開いてからログインしてください。");
      setAuthMode("signIn");
    } else {
      setMessage("ログインしました。");
    }
    setBusy(false);
  }

  async function addSubject(event) {
    event.preventDefault();
    const name = subjectName.trim();
    if (!name || !session?.user) return;

    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("subjects").insert({
      user_id: session.user.id,
      name,
      description: subjectDescription.trim() || null,
      color: "#6750a4",
    });

    if (error) {
      setMessage("追加に失敗しました: " + error.message);
    } else {
      setSubjectName("");
      setSubjectDescription("");
      await loadSubjects();
      setMessage("科目を追加しました！");
    }
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    setBusy(false);
  }

  if (busy && !session) {
    return h("main", { className: "shell" }, h("p", { className: "loading" }, "読み込み中..."));
  }

  const hero = h("header", { className: "hero" },
    h("div", { className: "logo" }, "SP"),
    h("div", null,
      h("p", { className: "eyebrow" }, "STUDY MANAGEMENT"),
      h("h1", null, "StudyPilot"),
      h("p", { className: "tagline" }, "今日やることを、迷わない。"),
    ),
  );

  const authCard = h("section", { className: "card auth-card" },
    h("p", { className: "eyebrow" }, authMode === "signIn" ? "WELCOME BACK" : "GET STARTED"),
    h("h2", null, authMode === "signIn" ? "ログイン" : "アカウント作成"),
    h("form", { onSubmit: handleAuth },
      h(Field, { label: "メールアドレス" },
        h("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true })),
      h(Field, { label: "パスワード" },
        h("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), minLength: 6, required: true })),
      h("button", { className: "primary", disabled: busy }, busy ? "処理中..." : authMode === "signIn" ? "ログイン" : "登録する"),
    ),
    h("button", {
      className: "text-button",
      onClick: () => {
        setAuthMode(authMode === "signIn" ? "signUp" : "signIn");
        setMessage("");
      },
    }, authMode === "signIn" ? "初めての方はこちら" : "ログインに戻る"),
  );

  const addCard = h("section", { className: "card" },
    h("p", { className: "eyebrow" }, "NEW SUBJECT"),
    h("h2", null, "科目を追加"),
    h("form", { onSubmit: addSubject },
      h(Field, { label: "科目名" },
        h("input", { value: subjectName, onChange: e => setSubjectName(e.target.value), maxLength: 80, placeholder: "例：情報処理安全確保支援士", required: true })),
      h(Field, { label: "メモ" },
        h("textarea", { value: subjectDescription, onChange: e => setSubjectDescription(e.target.value), maxLength: 300, placeholder: "目標や勉強方針（任意）" })),
      h("button", { className: "primary", disabled: busy }, busy ? "保存中..." : "科目を追加"),
    ),
  );

  const subjectItems = subjects.map(subject =>
    h("li", { key: subject.id },
      h("span", { className: "subject-dot", style: { background: subject.color || "#6750a4" } }),
      h("div", null,
        h("strong", null, subject.name),
        h("p", null, subject.description || "メモなし"),
      ),
    ),
  );

  const listContent = busy
    ? h("p", { className: "muted" }, "読み込み中...")
    : subjects.length === 0
      ? h("div", { className: "empty" }, h("p", null, "まだ科目がありません。"), h("small", null, "左のフォームから最初の科目を追加しよう。"))
      : h("ul", { className: "subject-list" }, subjectItems);

  const listCard = h("section", { className: "card" },
    h("div", { className: "section-heading" },
      h("div", null, h("p", { className: "eyebrow" }, "MY SUBJECTS"), h("h2", null, "科目一覧")),
      h("span", { className: "count" }, String(subjects.length)),
    ),
    listContent,
  );

  const dashboard = h(React.Fragment, null,
    h("section", { className: "account-bar" },
      h("span", null, session?.user.email),
      h("button", { className: "secondary", onClick: signOut }, "ログアウト"),
    ),
    h("div", { className: "dashboard" }, addCard, listCard),
  );

  return h("main", { className: "shell" },
    hero,
    session ? dashboard : authCard,
    message && h("p", { className: "notice", role: "status" }, message),
    h("footer", null, "Supabase接続済み · データはログインした本人だけが閲覧できます"),
  );
}

createRoot(document.getElementById("root")).render(h(App));
