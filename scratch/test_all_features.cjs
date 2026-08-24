const axios = require("axios");

const BASE = "http://localhost:8002/api";

async function testAll() {
  console.log("==================================================");
  console.log("🚀 STARTING FULL ONEDESK END-TO-END TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (e) {
      console.log("❌ FAILED");
      console.error("   Error:", e?.response?.data || e.message);
      failed++;
    }
  }

  // 1. Meta
  await check("API Health & Meta Configuration", async () => {
    const r = await axios.get(`${BASE}/`);
    if (!r.data.ok || r.data.app !== "OneDesk") throw new Error("Meta mismatch");
    const m = await axios.get(`${BASE}/meta`);
    if (!m.data.classes || !m.data.departments) throw new Error("Meta data missing");
  });

  // 2. Auth - Teacher Login
  let teacherToken = "";
  let teacherId = "";
  await check("Teacher Authentication (Login)", async () => {
    const r = await axios.post(`${BASE}/auth/login`, {
      email: "teacher@onedesk.com",
      password: "teacher123",
      role: "teacher",
    });
    if (!r.data.token || r.data.user.role !== "teacher") throw new Error("Teacher login failed");
    teacherToken = r.data.token;
    teacherId = r.data.user.id;
  });

  // 3. Auth - Student Login via Enrollment Number
  let studentToken = "";
  let studentId = "";
  await check("Student Authentication via Enrollment Number", async () => {
    const r = await axios.post(`${BASE}/auth/login`, {
      enrollment_number: "AC2025001",
      password: "student123",
      role: "student",
    });
    if (!r.data.token || r.data.user.role !== "student") throw new Error("Student login failed");
    studentToken = r.data.token;
    studentId = r.data.user.id;
  });

  const tAuth = { headers: { Authorization: `Bearer ${teacherToken}` } };
  const sAuth = { headers: { Authorization: `Bearer ${studentToken}` } };

  // 4. Subjects
  let subjectId = "";
  await check("Teacher Subject Creation & Retrieval", async () => {
    const subCode = "CS" + Math.floor(100 + Math.random() * 800);
    const cr = await axios.post(`${BASE}/subjects`, { name: "Cloud Architecture", code: subCode, color: "indigo" }, tAuth);
    subjectId = cr.data.id;
    const r = await axios.get(`${BASE}/subjects`, tAuth);
    if (!r.data.find(s => s.id === subjectId)) throw new Error("Subject not listed");
  });

  // 5. Timetable & Conflict Detection
  let slotId = "";
  await check("Timetable Slot Creation & Conflict Overlap Prevention", async () => {
    const randomDay = Math.floor(Math.random() * 5); // 0..4
    const slot = await axios.post(`${BASE}/timetable`, {
      subject_id: subjectId,
      class_name: "SE-A",
      academic_year: "2",
      day: randomDay,
      start_time: "10:00",
      end_time: "11:00",
      room: "Lab 3"
    }, tAuth);
    slotId = slot.data.id;

    // Try creating overlapping slot for SE-A on same day 10:30-11:30
    try {
      await axios.post(`${BASE}/timetable`, {
        subject_id: subjectId,
        class_name: "SE-A",
        academic_year: "2",
        day: randomDay,
        start_time: "10:30",
        end_time: "11:30",
        room: "Lab 4"
      }, tAuth);
      throw new Error("Conflict detection failed to block overlapping timeslot!");
    } catch (err) {
      if (!err.response || err.response.status !== 400) throw err;
      // Overlap correctly rejected!
    }

    // Clean up created test slot
    await axios.delete(`${BASE}/timetable/${slotId}`, tAuth);
  });

  // 6. Attendance & Geofencing Lock
  let sessionToken = "";
  let sessionId = "";
  await check("Attendance QR Session & Dynamic Rotating Live Endpoint", async () => {
    const sess = await axios.post(`${BASE}/attendance/session`, {
      subject_id: subjectId,
      class_name: "SE-A",
      duration_min: 15,
    }, tAuth);
    sessionId = sess.data.id;
    sessionToken = sess.data.token;

    const live = await axios.get(`${BASE}/attendance/session/${sessionId}/live`, tAuth);
    if (!live.data.rotating_token || !Array.isArray(live.data.marks)) throw new Error("Live endpoint invalid");

    const pub = await axios.get(`${BASE}/attendance/public/${sessionToken}`);
    if (pub.data.subject_name !== "Cloud Architecture") throw new Error("Public QR landing invalid");
  });

  await check("Attendance GPS Geofence Lock (Pimpri Chinchwad Polytechnic)", async () => {
    // 1. Attempt from off-campus (e.g., Delhi coordinates: 28.6139, 77.2090) -> MUST FAIL
    try {
      await axios.post(`${BASE}/attendance/mark`, {
        token: sessionToken,
        latitude: 28.6139,
        longitude: 77.2090
      }, sAuth);
      throw new Error("Geofence failed to block off-campus attendance!");
    } catch (err) {
      if (!err.response || err.response.status !== 403) throw err;
    }

    // 2. Attempt from on-campus (Pimpri Chinchwad Polytechnic: 18.6508, 73.7663) -> MUST SUCCEED
    const markRes = await axios.post(`${BASE}/attendance/mark`, {
      token: sessionToken,
      latitude: 18.6508,
      longitude: 73.7663
    }, sAuth);
    if (!markRes.data.ok) throw new Error("On-campus attendance marking failed");
  });

  // 7. Attendance Reports & Defaulters
  await check("Attendance Reports & Defaulter (<75%) Calculation", async () => {
    const tReport = await axios.get(`${BASE}/attendance/report`, tAuth);
    if (!Array.isArray(tReport.data.report)) throw new Error("Teacher report missing");
    const sReport = await axios.get(`${BASE}/attendance/report`, sAuth);
    if (!Array.isArray(sReport.data.summary)) throw new Error("Student report missing");
  });

  // 8. Assignments & Submissions & Grading
  let assignmentId = "";
  await check("Assignment Creation, Student Submission & Teacher Grading", async () => {
    const asg = await axios.post(`${BASE}/assignments`, {
      title: "Docker Containerization Project",
      description: "Submit Dockerfile and compose setup",
      subject_id: subjectId,
      class_name: "SE-A",
      due_date: "2026-09-01"
    }, tAuth);
    assignmentId = asg.data.id;

    // Student submits
    await axios.post(`${BASE}/assignments/${assignmentId}/submit`, {
      text_content: "https://github.com/student/docker-proj",
      file_name: "docker-solution.pdf"
    }, sAuth);

    // Teacher grades
    const gr = await axios.post(`${BASE}/assignments/${assignmentId}/grade/${studentId}`, {
      grade: "A+",
      feedback: "Outstanding setup!"
    }, tAuth);
    if (!gr.data.ok) throw new Error("Grading failed");
  });

  // 9. Quizzes & Analytics
  let quizId = "";
  await check("Quiz Center Creation, Student Attempt & Analytics", async () => {
    const qz = await axios.post(`${BASE}/quizzes`, {
      title: "Cloud Infrastructure Quiz",
      subject_id: subjectId,
      class_name: "SE-A",
      academic_year: "2",
      duration_min: 10,
      questions: [
        { question: "What does IaaS stand for?", options: ["Internet as a Service", "Infrastructure as a Service", "Info as a Service", "None"], correct_index: 1, points: 1 },
        { question: "Which is a managed container service?", options: ["Kubernetes", "Excel", "Photoshop", "Notepad"], correct_index: 0, points: 1 }
      ]
    }, tAuth);
    quizId = qz.data.id;

    // Student attempts (answers: [1, 0] -> 100%)
    const att = await axios.post(`${BASE}/quizzes/${quizId}/attempt`, {
      answers: [1, 0]
    }, sAuth);
    if (att.data.percent !== 100) throw new Error(`Expected 100%, got ${att.data.percent}%`);

    // Teacher views analytics
    const an = await axios.get(`${BASE}/quizzes/${quizId}/analytics`, tAuth);
    if (an.data.stats.count < 1 || an.data.stats.avg !== 100) throw new Error("Quiz analytics failed");
  });

  // 10. Notices (Campus Broadcast)
  let noticeId = "";
  await check("Campus Notice Broadcast & Audience Filter", async () => {
    const n = await axios.post(`${BASE}/notices`, {
      title: "Campus Tech Symposium 2026",
      body: "All students and faculty are invited to the auditorium on Friday.",
      audience: "all"
    }, tAuth);
    noticeId = n.data.id;

    const list = await axios.get(`${BASE}/notices`, sAuth);
    if (!list.data.find(x => x.id === noticeId)) throw new Error("Student notice retrieval failed");
  });

  // 11. Lost & Found
  let lostId = "";
  await check("Lost & Found Reporting and Resolution", async () => {
    const item = await axios.post(`${BASE}/lostfound`, {
      title: "Scientific Calculator FX-991EX",
      description: "Left in Room 304 near window",
      location: "Room 304",
      kind: "lost"
    }, sAuth);
    lostId = item.data.id;

    const res = await axios.post(`${BASE}/lostfound/${lostId}/resolve`, {}, sAuth);
    if (!res.data.ok) throw new Error("Lost & found resolution failed");
  });

  // 12. Dashboard Stats
  await check("Teacher & Student Dashboard Aggregated Stats", async () => {
    const tStats = await axios.get(`${BASE}/dashboard/stats`, tAuth);
    if (tStats.data.subjects === undefined || tStats.data.assignments === undefined) throw new Error("Teacher stats invalid");
    const sStats = await axios.get(`${BASE}/dashboard/stats`, sAuth);
    if (sStats.data.attendance_percent === undefined) throw new Error("Student stats invalid");
  });

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

testAll().catch(e => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
