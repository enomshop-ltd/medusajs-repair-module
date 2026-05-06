async function run() {
  const res = await fetch("http://localhost:9000/admin/repairs/01KQZA32EZDWJZT1GWA246YJ5H/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Test msg" })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
