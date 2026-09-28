// Deterministic static auth regression checks; run with: node qa_auth_regression.js
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[
 ['registration OTP route',read('server/routes/authRoutes.js').includes("'/verify-email'" )],
 ['reset OTP route',read('server/routes/authRoutes.js').includes("'/verify-reset-otp'")],
 ['OTP email service',read('server/services/emailService.js').includes('sendPasswordResetEmail')&&read('server/services/emailService.js').includes('ONE-TIME CODE')],
 ['registration profile fields',read('server/models/User.js').includes('gender:')&&read('server/models/User.js').includes('dateOfBirth:')],
 ['public home route',read('client/src/App.jsx').includes('<Route path="/" element={<Home/>}/>')],
 ['admin protected',read('client/src/App.jsx').includes('<Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>}/>')],
 ['admin unauthenticated redirect',read('client/src/components/AdminRoute.jsx').includes('to="/login"')],
 ['protected shopping routes',read('client/src/App.jsx').includes('<ProtectedRoute><Cart/>')&&read('client/src/App.jsx').includes('<ProtectedRoute><Checkout/>')],
 ['reset query route',read('client/src/App.jsx').includes('<Route path="/reset-password"')],
 ['price filter baseline',(()=>{const dirs=[path.join(root,'client/src'),path.join(root,'server')];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);return !dirs.flatMap(walk).filter(f=>/\.(js|jsx|css)$/.test(f)&&!f.endsWith('qa_auth_regression.js')).some(f=>fs.readFileSync(f,'utf8').includes('40000'));})()],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed){process.exitCode=1;console.error(`${failed} static checks failed`)}else console.log(`PASS ${checks.length}/${checks.length} static auth/deployment checks`);
