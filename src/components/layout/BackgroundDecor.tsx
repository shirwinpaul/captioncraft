/** Soft gradient blobs behind everything. Purely decorative. */
export function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[20vmax] -top-[18vmax] size-[50vmax] rounded-full bg-violet-500 opacity-(--blob-opacity) blur-[110px]" />
      <div className="absolute -right-[22vmax] top-[10vmax] size-[44vmax] rounded-full bg-pink-500 opacity-(--blob-opacity) blur-[120px]" />
      <div className="absolute -bottom-[26vmax] left-[15vmax] size-[46vmax] rounded-full bg-orange-400 opacity-(--blob-opacity) blur-[130px]" />
    </div>
  );
}
