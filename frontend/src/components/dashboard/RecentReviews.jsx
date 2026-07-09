const reviews = [
  {
    language: "JavaScript",
    score: 93,
    date: "Today",
  },
  {
    language: "Python",
    score: 88,
    date: "Yesterday",
  },
  {
    language: "Java",
    score: 95,
    date: "2 days ago",
  },
];

export default function RecentReviews() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-6 text-xl font-semibold">Recent Reviews</h2>

      <table className="w-full">
        <thead className="text-zinc-500">
          <tr>
            <th className="pb-4 text-left">Language</th>

            <th className="pb-4 text-left">Score</th>

            <th className="pb-4 text-left">Date</th>
          </tr>
        </thead>

        <tbody>
          {reviews.map((review, index) => (
            <tr key={index} className="border-t border-zinc-800">
              <td className="py-4">{review.language}</td>

              <td className="text-green-400">{review.score}/100</td>

              <td>{review.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
