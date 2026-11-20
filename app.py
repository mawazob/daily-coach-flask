from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # lets your Live Server page call this API

COACHING = {
  "111": ["Strong inputs, strong output. Sleep and hydration are locked in.",
          "Keep this baseline and the steps will follow."],
  "110": ["Hit the goal despite low water. Sleep is the primary driver.",
          "Close the hydration gap tomorrow."],
  "101": ["Water carried today despite low sleep.",
          "Shore up sleep tonight. Hitting goals on low sleep has hidden costs."],
  "100": ["Goal hit but both inputs are below threshold. That is willpower, not system.",
          "Build the foundation: sleep first, water second."],
  "011": ["Inputs were solid but the goal was missed.",
          "Audit your schedule. Do not cut sleep or water."],
  "010": ["Sleep is solid, hydration is low, goal was missed.",
          "Add two glasses of water tomorrow. Hydration shifts output more than expected."],
  "001": ["Low sleep is the primary issue. Water is fine.",
          "Get to bed 45 minutes earlier. The effect shows within 72 hours."],
  "000": ["Both sleep and water are below threshold and the goal was missed.",
          "Reset tonight: 8 hours minimum sleep, 10 glasses of water tomorrow."],
}

def predict_goal(sleep, water, steps):
    total = (min(sleep / 8, 1) * 35
             + min(water / 10, 1) * 25
             + min(steps / 12000, 1) * 40)
    hit_goal = total >= 60
    confidence = min(0.50 + abs(total - 60) * 0.012, 0.95)
    return hit_goal, confidence, round(total)

def get_coaching(sleep, water, hit_goal):
    key = f"{int(hit_goal)}{int(sleep >= 7)}{int(water >= 8)}"
    return " ".join(COACHING[key])

@app.route("/api/coach", methods=["POST"])
def coach():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Send JSON in the request body."}), 400

    # Read and convert the values; fail cleanly if one is missing or not a number
    try:
        name = str(data["name"]).strip()
        sleep = float(data["sleep"])
        water = float(data["water"])
        steps = int(data["steps"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "name, sleep, water and steps are required numbers."}), 400

    if name == "":
        return jsonify({"error": "Name cannot be empty."}), 400
    if not (0 < sleep < 24):
        return jsonify({"error": "Sleep must be between 0 and 24 hours."}), 400
    if water <= 0:
        return jsonify({"error": "Water must be greater than 0."}), 400
    if steps < 100:
        return jsonify({"error": "Minimum step count is 100."}), 400

    hit_goal, confidence, score = predict_goal(sleep, water, steps)
    return jsonify({
        "hitGoal": hit_goal,
        "confidence": confidence,
        "score": score,
        "message": get_coaching(sleep, water, hit_goal),
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)

