import HeaderLeft from "./left-side";
import HeaderRight from "./right-side";

export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 mx-3 flex items-center justify-between py-2">
      <HeaderLeft />
      <HeaderRight />
    </div>
  );
}
