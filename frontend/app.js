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
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [authMode, setAuthMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskMinutes, setTaskMinutes] = useState("");
  const [logSubjectId, setLogSubjectId] = useState("");
  const [logTaskId, setLogTaskId] = useState("");
  const [studiedOn, setStudiedOn] = useState(new Date().toISOString().slice(0, 10));
  const [durationMinutes, setDurationMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBusy(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setSubjects([]);
        setTasks([]);
        setLogs([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadSubjects();
      loadTasks();
      loadLogs();
    }
  }, [session]);

  async function loadSubjects() {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase
      .from("subjects")
      .select("id,name,description,color,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("読み込みに失敗しました: " + error.message);
    } else {
      const nextSubjects = data ?? [];
      setSubjects(nextSubjects);
      setSelectedSubjectId(current => current || nextSubjects[0]?.id || "");
      setLogSubjectId(current => current || nextSubjects[0]?.id || "");
    }
    setBusy(false);
  }

  async function loadTasks() {
    const { data, error } = await supabase
      .from("study_tasks")
      .select("id,subject_id,title,status,due_date,estimated_minutes,created_at")
      .order("created_at", { ascending: false });

    if (error) setMessage("タスクの読み込みに失敗しました: " + error.message);
    else setTasks(data ?? []);
  }

  async function loadLogs() {
    const { data, error } = await supabase
      .from("study_logs")
      .select("id,subject_id,task_id,studied_on,duration_minutes,note,created_at")
      .order("studied_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setMessage("勉強実績の読み込みに失敗しました: " + error.message);
    else setLogs(data ?? []);
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
      color: "#2563eb",
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

  async function addTask(event) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title || !selectedSubjectId || !session?.user) return;

    setBusy(true);
    setMessage("");
    const minutes = taskMinutes === "" ? null : Number(taskMinutes);
    const { error } = await supabase.from("study_tasks").insert({
      user_id: session.user.id,
      subject_id: selectedSubjectId,
      title,
      due_date: taskDueDate || null,
      estimated_minutes: minutes,
    });

    if (error) {
      setMessage("タスク追加に失敗しました: " + error.message);
    } else {
      setTaskTitle("");
      setTaskDueDate("");
      setTaskMinutes("");
      await loadTasks();
      setMessage("タスクを追加しました！");
    }
    setBusy(false);
  }

  async function completeTask(taskId) {
    setBusy(true);
    setMessage("");
    const { error } = await supabase
      .from("study_tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) setMessage("タスク更新に失敗しました: " + error.message);
    else {
      await loadTasks();
      setMessage("タスクを完了にしました！");
    }
    setBusy(false);
  }

  async function addStudyLog(event) {
    event.preventDefault();
    const minutes = Number(durationMinutes);
    if (!session?.user || !logSubjectId || !studiedOn || !Number.isFinite(minutes) || minutes <= 0) return;

    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("study_logs").insert({
      user_id: session.user.id,
      subject_id: logSubjectId,
      task_id: logTaskId || null,
      studied_on: studiedOn,
      duration_minutes: minutes,
      note: logNote.trim() || null,
    });

    if (error) {
      setMessage("勉強実績の保存に失敗しました: " + error.message);
    } else {
      setDurationMinutes("");
      setLogNote("");
      setLogTaskId("");
      await loadLogs();
      setMessage("勉強実績を記録しました！");
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
      h("span", { className: "subject-dot", style: { background: subject.color === "#6750a4" ? "#2563eb" : (subject.color || "#2563eb") } }),
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

  const taskItems = tasks.map(task => {
    const subject = subjects.find(item => item.id === task.subject_id);
    return h("li", { key: task.id, className: task.status === "done" ? "task done" : "task" },
      h("div", { className: "task-main" },
        h("span", { className: "task-subject" }, subject?.name || "科目"),
        h("strong", null, task.title),
        h("p", null,
          task.due_date ? "期限 " + task.due_date : "期限なし",
          task.estimated_minutes != null ? " · " + task.estimated_minutes + "分" : "",
        ),
      ),
      task.status === "done"
        ? h("span", { className: "done-label" }, "完了")
        : h("button", { className: "secondary", disabled: busy, onClick: () => completeTask(task.id) }, "完了にする"),
    );
  });

  const taskCard = h("section", { className: "card task-card" },
    h("div", { className: "section-heading" },
      h("div", null, h("p", { className: "eyebrow" }, "STUDY TASKS"), h("h2", null, "勉強タスク")),
      h("span", { className: "count" }, String(tasks.filter(task => task.status !== "done").length)),
    ),
    subjects.length === 0
      ? h("p", { className: "muted" }, "先に科目を追加してください。")
      : h("div", { className: "task-layout" },
          h("form", { onSubmit: addTask },
            h(Field, { label: "科目" },
              h("select", { value: selectedSubjectId, onChange: e => setSelectedSubjectId(e.target.value), required: true },
                subjects.map(subject => h("option", { key: subject.id, value: subject.id }, subject.name)))),
            h(Field, { label: "タスク名" },
              h("input", { value: taskTitle, onChange: e => setTaskTitle(e.target.value), maxLength: 120, placeholder: "例：科目Bを1問解く", required: true })),
            h("div", { className: "form-row" },
              h(Field, { label: "期限" },
                h("input", { type: "date", value: taskDueDate, onChange: e => setTaskDueDate(e.target.value) })),
              h(Field, { label: "予定時間（分）" },
                h("input", { type: "number", min: 0, max: 1440, value: taskMinutes, onChange: e => setTaskMinutes(e.target.value), placeholder: "30" }))),
            h("button", { className: "primary", disabled: busy }, busy ? "保存中..." : "タスクを追加"),
          ),
          tasks.length === 0
            ? h("div", { className: "empty" }, h("p", null, "まだタスクがありません。"), h("small", null, "最初にやることを登録しよう。"))
            : h("ul", { className: "task-list" }, taskItems),
        ),
  );

  const formatLocalDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  };
  const today = new Date();
  const todayKey = formatLocalDate(today);
  const weekStart = new Date(today);
  const dayFromMonday = (today.getDay() + 6) % 7;
  weekStart.setDate(today.getDate() - dayFromMonday);
  const weekStartKey = formatLocalDate(weekStart);
  const todayMinutes = logs
    .filter(log => log.studied_on === todayKey)
    .reduce((sum, log) => sum + log.duration_minutes, 0);
  const weekMinutes = logs
    .filter(log => log.studied_on >= weekStartKey && log.studied_on <= todayKey)
    .reduce((sum, log) => sum + log.duration_minutes, 0);
  const openTaskCount = tasks.filter(task => task.status !== "done").length;
  const totalMinutes = logs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const availableLogTasks = tasks.filter(task => task.subject_id === logSubjectId);
  const logItems = logs.map(log => {
    const subject = subjects.find(item => item.id === log.subject_id);
    const task = tasks.find(item => item.id === log.task_id);
    return h("li", { key: log.id, className: "log-item" },
      h("div", { className: "log-duration" }, h("strong", null, String(log.duration_minutes)), h("span", null, "分")),
      h("div", { className: "log-main" },
        h("strong", null, subject?.name || "削除済みの科目"),
        h("p", null, log.studied_on, task ? " · " + task.title : "", log.note ? " · " + log.note : ""),
      ),
    );
  });

  const logCard = h("section", { className: "card log-card" },
    h("div", { className: "section-heading" },
      h("div", null, h("p", { className: "eyebrow" }, "STUDY LOG"), h("h2", null, "勉強実績")),
      h("div", { className: "total-time" }, h("strong", null, String(totalMinutes)), h("span", null, "分 合計")),
    ),
    subjects.length === 0
      ? h("p", { className: "muted" }, "先に科目を追加してください。")
      : h("div", { className: "log-layout" },
          h("form", { onSubmit: addStudyLog },
            h(Field, { label: "科目" },
              h("select", { value: logSubjectId, onChange: e => { setLogSubjectId(e.target.value); setLogTaskId(""); }, required: true },
                subjects.map(subject => h("option", { key: subject.id, value: subject.id }, subject.name)))),
            h(Field, { label: "関連タスク（任意）" },
              h("select", { value: logTaskId, onChange: e => setLogTaskId(e.target.value) },
                h("option", { value: "" }, "タスクを選択しない"),
                availableLogTasks.map(task => h("option", { key: task.id, value: task.id }, task.title)))),
            h("div", { className: "form-row" },
              h(Field, { label: "勉強日" },
                h("input", { type: "date", value: studiedOn, onChange: e => setStudiedOn(e.target.value), required: true })),
              h(Field, { label: "勉強時間（分）" },
                h("input", { type: "number", min: 1, max: 1440, value: durationMinutes, onChange: e => setDurationMinutes(e.target.value), placeholder: "60", required: true }))),
            h(Field, { label: "メモ" },
              h("textarea", { value: logNote, onChange: e => setLogNote(e.target.value), maxLength: 500, placeholder: "例：IPsecを復習した" })),
            h("button", { className: "primary", disabled: busy }, busy ? "保存中..." : "勉強実績を記録"),
          ),
          logs.length === 0
            ? h("div", { className: "empty" }, h("p", null, "まだ勉強実績がありません。"), h("small", null, "今日の勉強を記録しよう。"))
            : h("ul", { className: "log-list" }, logItems),
        ),
  );

  const summaryCards = h("section", { className: "summary-grid" },
    h("article", { className: "summary-card accent" },
      h("span", null, "今日の勉強"),
      h("strong", null, String(todayMinutes)),
      h("small", null, "分"),
    ),
    h("article", { className: "summary-card" },
      h("span", null, "今週の合計"),
      h("strong", null, String(weekMinutes)),
      h("small", null, "分"),
    ),
    h("article", { className: "summary-card" },
      h("span", null, "未完了タスク"),
      h("strong", null, String(openTaskCount)),
      h("small", null, "件"),
    ),
    h("article", { className: "summary-card" },
      h("span", null, "累計勉強"),
      h("strong", null, String(totalMinutes)),
      h("small", null, "分"),
    ),
  );

  const dashboard = h(React.Fragment, null,
    h("section", { className: "account-bar" },
      h("span", null, session?.user.email),
      h("button", { className: "secondary", onClick: signOut }, "ログアウト"),
    ),
    summaryCards,
    h("div", { className: "dashboard" }, addCard, listCard),
    taskCard,
    logCard,
  );

  return h("main", { className: "shell" },
    hero,
    session ? dashboard : authCard,
    message && h("p", { className: "notice", role: "status" }, message),
    h("footer", null, "Supabase接続済み · データはログインした本人だけが閲覧できます"),
  );
}

createRoot(document.getElementById("root")).render(h(App));
