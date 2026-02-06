// React 应用主入口 - Chromeless Layout
import FlowEditor from './components/Canvas/FlowEditor';
import Sidebar from './components/Sidebar/Sidebar';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <FlowEditor />
    </div>
  );
}

export default App;
