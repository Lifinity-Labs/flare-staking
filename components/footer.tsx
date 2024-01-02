const Footer = () => {
  return (
    <section className="mt-auto pt-8 pb-8">
      <ul className="flex justify-center items-center gap-8">
        <li className="w-5">
          <a
            href="https://twitter.com/Lifinity_io"
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="opacity-50 hover:opacity-80"
              src="/assets/icons/twitter.svg"
            />
          </a>
        </li>
        <li className="w-5">
          <a
            href="https://discord.gg/K2tvfcXwWr"
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="opacity-50 hover:opacity-80"
              src="/assets/icons/discord.png"
            />
          </a>
        </li>
        <li className="w-5">
          <a
            href="https://docs.lifinity.io/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="opacity-50 hover:opacity-80"
              src="/assets/icons/gitbook-white.svg"
            />
          </a>
        </li>
        <li className="w-5">
          <a
            href="https://medium.com/@lifinity.io"
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="opacity-50 hover:opacity-80"
              src="/assets/icons/medium.svg"
            />
          </a>
        </li>
      </ul>
    </section>
  );
};

export default Footer;
