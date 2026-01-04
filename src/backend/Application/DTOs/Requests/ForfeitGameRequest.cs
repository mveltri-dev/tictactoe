using System;

namespace Application.DTOs.Requests
{
    public class ForfeitGameRequest
    {
        public Guid GameId { get; set; }
        public Guid PlayerId { get; set; }
    }
}
