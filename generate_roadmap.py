import matplotlib.pyplot as plt
import numpy as np

# Data
stages = ["Pilot", "City", "State", "National"]
details = [
    "1 Ward, 10 buildings\nin Vadodara",
    "Vadodara city-wide,\n100+ buildings",
    "Gujarat urban centers,\n1,000+ buildings,\nstate integration",
    "10,000+ buildings,\nMoHUA API integration"
]
timelines = ["90 days", "6 months", "12 months", "24 months"]

# Create figure - taller for vertical layout
fig, ax = plt.subplots(figsize=(8, 12), dpi=300)
ax.set_xlim(-1, 2)
# Reverse y-axis so it flows from top to bottom
ax.set_ylim(len(stages) - 0.5, -0.5)
ax.axis('off')

# Plot the timeline line (vertical)
ax.vlines(0, 0, len(stages) - 1, color='gray', linewidth=3, zorder=1)

colors = ['#FF9999', '#66B2FF', '#99FF99', '#FFCC99']

# Plot points and text
for i in range(len(stages)):
    # Plot point
    ax.scatter(0, i, s=800, color=colors[i], edgecolors='white', linewidth=3, zorder=2)
    
    # Title (to the right)
    ax.text(0.2, i, stages[i], ha='left', va='bottom', fontsize=18, fontweight='bold', color='#333333')
    
    # Details (below the title)
    ax.text(0.2, i + 0.15, details[i], ha='left', va='top', fontsize=14, color='#555555')
    
    # Timeline
    if i < len(stages) - 1:
        # Midpoint for time between nodes
        mid = i + 0.5
        ax.text(-0.1, mid, timelines[i], ha='right', va='center', fontsize=14, fontweight='bold', color='#FF6666')
    else:
        # Last timeline next to the last node
        ax.text(-0.1, i, timelines[i], ha='right', va='center', fontsize=14, fontweight='bold', color='#FF6666')

plt.title("Scalability Roadmap", fontsize=24, fontweight='bold', pad=20, color='#111111', loc='center')
plt.tight_layout()
plt.savefig("scalability_roadmap.png", bbox_inches='tight', transparent=False, facecolor='white')
print("Image saved to scalability_roadmap.png")
