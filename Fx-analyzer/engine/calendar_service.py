import datetime

class CalendarService:
    """
    Mock service to provide high-impact economic events.
    In a real app, this would fetch from ForexFactory or an API.
    """
    def __init__(self):
        pass

    def get_todays_events(self):
        """
        Returns a list of high-impact events for today.
        """
        today = datetime.date.today().isoformat()
        
        # Mock Data
        events = [
            {
                "time": "13:30 GMT",
                "currency": "USD",
                "event": "CPI m/m",
                "impact": "High",
                "forecast": "0.3%"
            },
            {
                "time": "19:00 GMT",
                "currency": "USD",
                "event": "FOMC Meeting Minutes",
                "impact": "High",
                "forecast": ""
            }
        ]
        
        return {
            "date": today,
            "events": events
        }
