import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
      }}
    >

      
      <Navbar />

      <div
        style={{
          display: "flex",
        }}
      >
        <Sidebar />

        <div
  style={{
    flex: 1,

    marginLeft: "300px",

    padding: "140px 30px 30px 30px",

    minHeight: "100vh",

    background: "#0f172a",

    boxSizing: "border-box",
  }}
>
  {children}
</div>

      </div>
    </div>
  );
}

export default MainLayout;